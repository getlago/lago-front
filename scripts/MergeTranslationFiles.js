/* eslint no-console: ["error", { allow: ["info", "warn"] }] */
const fs = require('fs')
const path = require('path')

const glob = require('glob')

const DITTO_DIR = './ditto/'

const AVAILABLE_LOCALES = { en: 'en', fr: 'fr', nb: 'nb', de: 'de', it: 'it' }

/**
 * Get all files which match a given path
 * @param {string} path
 * @returns {string[]}
 */
function getFiles(fromPath) {
  return new Promise((resolve, reject) =>
    glob(fromPath, (error, files) => {
      if (error) {
        reject(error)
        return
      }
      resolve(files)
    })
  )
}

async function extract(locale) {
  const fileLocaleKey = locale === AVAILABLE_LOCALES.en ? 'base' : locale
  const files = await getFiles(path.join(DITTO_DIR, `*__${fileLocaleKey}.json`))
  const allKeys = files.reduce((acc, file) => {
    const newKeys = JSON.parse(fs.readFileSync(file), 'utf-8')

    return { ...acc, ...(newKeys || {}) }
  }, {})

  fs.writeFileSync(
    path.join(DITTO_DIR, `/${fileLocaleKey}.json`),
    `${JSON.stringify(allKeys, null, 2)}\n`
  )
}

async function main() {
  Object.keys(AVAILABLE_LOCALES).forEach(async (locale) => {
    try {
      await extract(locale)
    } catch (e) {
      console.info('\u001b[' + 31 + 'm' + '\nTranslations merge failed' + '\u001b[0m', e)
      process.exit(1)
    }
  })
}

main()
