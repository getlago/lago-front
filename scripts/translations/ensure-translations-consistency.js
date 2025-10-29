/* eslint no-console: ["error", { allow: ["info"] }] */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ANSI color codes for better output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

const TRANSLATIONS_DIR = path.join(__dirname, '../../translations')

function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')

    return JSON.parse(content)
  } catch (error) {
    console.info(`${colors.red}Error reading ${filePath}:${colors.reset}`, error.message)
    process.exit(1)
  }
}

function getAllKeys(obj, prefix = '') {
  let keys = []

  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key

    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getAllKeys(obj[key], fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys
}

function main() {
  console.info(`${colors.cyan}=== Translation Files Validator ===${colors.reset}\n`)

  // Get all translation files (excluding base.json and pt-BR.json)
  const files = fs
    .readdirSync(TRANSLATIONS_DIR)
    .filter((file) => file.endsWith('.json') && file !== 'base.json' && file !== 'pt-BR.json')
    .sort()

  if (files.length === 0) {
    console.info(
      `${colors.yellow}No translation files found (excluding base.json and pt-BR.json)${colors.reset}`,
    )
    return
  }

  console.info(`${colors.blue}Translation files to check:${colors.reset} ${files.join(', ')}\n`)

  // Read all files and collect their keys
  const fileData = []
  const allKeysSet = new Set()

  for (const file of files) {
    const filePath = path.join(TRANSLATIONS_DIR, file)
    const json = readJsonFile(filePath)
    const keys = getAllKeys(json)

    fileData.push({
      file,
      keys: new Set(keys),
    })

    // Add all keys to the master set
    keys.forEach((key) => allKeysSet.add(key))
  }

  const allKeys = Array.from(allKeysSet).sort()

  console.info(
    `${colors.blue}Total unique keys across all files:${colors.reset} ${allKeys.length}\n`,
  )
  console.info(`${'='.repeat(80)}\n`)

  let hasErrors = false
  const results = []

  // Check each translation file against the complete key set
  for (const data of fileData) {
    const { file, keys } = data

    // Find missing keys (in complete set but not in this file)
    const missingKeys = allKeys.filter((key) => !keys.has(key))

    results.push({
      file,
      totalKeys: keys.size,
      missingKeys,
      isValid: missingKeys.length === 0,
    })

    if (missingKeys.length > 0) {
      hasErrors = true
    }
  }

  // Display results
  for (const result of results) {
    if (result.isValid) {
      console.info(`${colors.green}✓ ${result.file}${colors.reset}`)
      console.info(`  Total keys: ${result.totalKeys}\n`)
    } else {
      console.info(`${colors.red}✗ ${result.file}${colors.reset}`)
      console.info(`  Total keys: ${result.totalKeys} (expected ${allKeys.length})`)

      if (result.missingKeys.length > 0) {
        console.info(`  ${colors.red}Missing keys: ${result.missingKeys.length}${colors.reset}`)
        result.missingKeys.slice(0, 10).forEach((key) => {
          console.info(`    - ${key}`)
        })
        if (result.missingKeys.length > 10) {
          console.info(`    ... and ${result.missingKeys.length - 10} more`)
        }
      }

      console.info()
    }
  }

  // Summary
  console.info(`${'='.repeat(80)}\n`)
  const validFiles = results.filter((r) => r.isValid).length
  const totalFiles = results.length

  if (hasErrors) {
    console.info(`${colors.red}Validation failed!${colors.reset}`)
    console.info(`${validFiles}/${totalFiles} files are valid\n`)

    // Provide summary of issues
    const totalMissing = results.reduce((sum, r) => sum + r.missingKeys.length, 0)

    if (totalMissing > 0) {
      console.info(
        `${colors.red}Total missing keys across all files: ${totalMissing}${colors.reset}`,
      )
    }

    process.exit(1)
  } else {
    console.info(`${colors.green}✓ All translation files are valid!${colors.reset}`)
    console.info(`${validFiles}/${totalFiles} files checked successfully\n`)
  }
}

main()
