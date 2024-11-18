/* eslint no-console: ["error", { allow: ["info"] }] */

const path = require('path')

const { globSync } = require('glob')
const { run: jscodeshift } = require('jscodeshift/src/Runner')

const SRC_DIR = './src/'

const transformPath = path.resolve('./scripts/transforms/skeleton-migrate-width-values.js')
const paths = globSync(path.join(SRC_DIR, '**/*.@(tsx)'), {
  ignore: ['**/node_modules/**', '**/graphql.tsx', '**/dist/**'],
})
const options = {
  // dry: true, // dry run (no changes are made to files)
  verbose: 1,
  parser: 'tsx',
}

async function main() {
  try {
    await jscodeshift(transformPath, paths, options)
  } catch (e) {
    console.info('\u001b[' + 31 + 'm' + 'Codemod transform failed' + '\u001b[0m', e)
    process.exit(1)
  }
}

main()
