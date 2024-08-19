/* eslint no-console: ["error", { allow: ["info"] }] */
const fs = require('fs')

const { globSync } = require('glob')

const TRANSLATION_FILES_PATH = './ditto/base.json' // './ditto/**.json' for when we'll support several languages

const KEY_RANDOM_CHARS_LENGTH = 11

function createRandomCharChain() {
  let result = ''
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  let counter = 0

  while (counter < KEY_RANDOM_CHARS_LENGTH) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
    counter += 1
  }
  return result
}

async function addNewTranslationsKey(numberOfKeysToAdd) {
  const translationFiles = globSync(TRANSLATION_FILES_PATH)

  // For each translations files
  translationFiles.forEach((file) => {
    // Get all translation keys
    const allTranslationsFromFile = JSON.parse(fs.readFileSync(file), 'utf-8')
    // Ignore timezone keys as they're used in the config without calling translate
    const existingKeysInTranslationFile = Object.keys(allTranslationsFromFile).filter(
      (key) => key.split('_')[0] !== 'TZ',
    )

    const newKeys = {}

    for (let i = 0; i < Number(numberOfKeysToAdd); i++) {
      const key = `text_${Date.now() + createRandomCharChain()}`

      if (newKeys[key] || existingKeysInTranslationFile.includes(key)) {
        i--
        continue
      }

      newKeys[key] = ''
    }

    // Happen the new keys to the existing ones in the file
    const updatedTranslations = { ...allTranslationsFromFile, ...newKeys }

    // Write the updated translations back to the file
    fs.writeFileSync(file, JSON.stringify(updatedTranslations, null, 2), 'utf-8')
  })
}

/**
 * Extract wrapper
 */
async function main() {
  try {
    const numberOfKeysToAdd = process.argv.slice(2)[0] || '1'

    await addNewTranslationsKey(numberOfKeysToAdd)

    console.info('\u001b[' + 32 + 'm' + '✔ All good' + '\u001b[0m')
  } catch (error) {
    console.info('\u001b[' + 31 + 'm' + '\nTranslation keys addition failed' + '\u001b[0m', error)
    process.exit(1)
  }
}

main()
