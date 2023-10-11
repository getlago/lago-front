const fs = require('fs')
const path = require('path')

const { globSync } = require('glob')

const DITTO_DIR = './ditto/'

const AVAILABLE_LOCALES = { en: 'en', fr: 'fr', nb: 'nb', de: 'de', it: 'it', es: 'es' }

async function extract(locale) {
  const fileLocaleKey = locale === AVAILABLE_LOCALES.en ? 'base' : locale
  const files = globSync(path.join(DITTO_DIR, `*__${fileLocaleKey}.json`))
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
      // eslint-disable-next-line no-console
      console.info('\u001b[' + 31 + 'm' + '\nTranslations merge failed' + '\u001b[0m', e)
      process.exit(1)
    }
  })
}

main()
