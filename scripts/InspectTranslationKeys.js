/* eslint no-console: ["error", { allow: ["info", "warn"] }] */
const fs = require('fs')
const path = require('path')

const _ = require('lodash')
const { globSync } = require('glob')
const { GettextExtractor, JsExtractors } = require('gettext-extractor')

const SRC_DIR = './src/'
const TRANSLATION_FILES_PATH = './ditto/base.json' // './ditto/**.json' for when we'll support several languages

async function extract(replaceMode) {
  // Extract all the translation keys by parsing the 'translate' function
  const extracts = new GettextExtractor()
    .createJsParser([
      JsExtractors.callExpression('translate', {
        arguments: { text: 0 },
      }),
    ])
    .parseFilesGlob(path.join(SRC_DIR, '**/*.@(ts|js|tsx|jsx)'))

  const foundKeys = Object.values(extracts.builder.contexts['']).reduce((acc, extracted) => {
    acc.push(extracted.text)
    return acc
  }, [])

  // Extract all the translation keys not used with 'translate' by matching 'text_[all]'
  const files = globSync(path.join(SRC_DIR, '**/*.@(ts|js|tsx|jsx)'))
  const usedKeysWithoutTranslate = files.reduce((acc, file) => {
    const content = fs.readFileSync(file, 'utf-8')
    const usedKeys = content.match(/\'text_(.*?)\'/g)

    if (usedKeys && usedKeys.length) {
      acc = [...acc, ...usedKeys.map((key) => key.replace(/\'/g, ''))]
    }

    return acc
  }, [])

  foundKeys.push(...usedKeysWithoutTranslate)

  const translationFiles = globSync(TRANSLATION_FILES_PATH)

  translationFiles.forEach((file) => {
    // Get all translation keys from the ditto file
    const dittoTranslations = JSON.parse(fs.readFileSync(file), 'utf-8')
    // Ignore timezone keys as they're used in the config without calling translate
    const dittoKeys = Object.keys(dittoTranslations).filter((key) => key.split('_')[0] !== 'TZ')
    const keysNotInDitto = _.uniq(_.difference(foundKeys, dittoKeys))
    const dittoKeysNotUsed = _.uniq(_.difference(dittoKeys, foundKeys))

    if (dittoKeysNotUsed.length || keysNotInDitto.length) {
      if (keysNotInDitto.length) {
        console.info(
          '\u001b[' +
            31 +
            'm' +
            `\n----- Keys used but not defined ----- ${keysNotInDitto.length}` +
            '\u001b[0m',
        )
        console.info(keysNotInDitto.join('\n'))
      }
      if (dittoKeysNotUsed.length) {
        console.info(
          '\u001b[' +
            31 +
            'm' +
            `\n----- Keys defined but not used ----- ${dittoKeysNotUsed.length}` +
            '\u001b[0m',
        )
        console.info(dittoKeysNotUsed.join('\n'))

        if (replaceMode) {
          for (let i = 0; i < dittoKeysNotUsed.length; i++) {
            const key = dittoKeysNotUsed[i]
            const translation = dittoTranslations[key]

            // Iterate through each file to replace the translation string
            for (let j = 0; j < files.length; j++) {
              const filePath = files[j]
              let fileContent = fs.readFileSync(filePath, 'utf-8')

              // Perform a global replace for all occurrences of the translation string
              const regex = new RegExp(`TODO: ${translation}`, 'g')
              const replacedContent = fileContent.replace(regex, key)

              // Check if replacement occurred in this file
              if (replacedContent !== fileContent) {
                console.info(`Replacing '${translation}' with '${key}' in: ${filePath}`)
                // Write the modified content back to the file
                fs.writeFileSync(filePath, replacedContent, 'utf-8')
              }
            }
          }

          console.info('\u001b[' + 32 + 'm' + '✔ Replacements done' + '\u001b[0m')
        }
      }

      throw Error
    } else {
      console.info('\u001b[' + 32 + 'm' + '✔ All good' + '\u001b[0m')
    }
  })
}

/**
 * Extract wrapper
 */
async function main() {
  try {
    const replaceMode = process.argv.includes('--replace')

    await extract(replaceMode)
  } catch (e) {
    console.info('\u001b[' + 31 + 'm' + '\nTranslation check failed' + '\u001b[0m', e)
    process.exit(1)
  }
}

main()
