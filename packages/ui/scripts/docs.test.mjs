import assert from 'node:assert/strict'
import { existsSync, mkdtempSync, readdirSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'

import { buildAiDocs, guidePaths } from './build-ai-docs.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const componentsDir = join(root, 'src/components')

const REQUIRED_SECTIONS = [
  '## When to use',
  '## Import',
  '## API',
  '## Examples',
  '## Accessibility',
  '## Design',
  '## References',
]
const STALE_REFERENCES = ['/design-system/', 'src/components/ui', 'styles/v2', "from '~/"]

const components = readdirSync(componentsDir)
  .filter((file) => file.endsWith('.tsx') && !file.endsWith('.stories.tsx'))
  .map((file) => file.replace(/\.tsx$/, ''))

const markdownFiles = guidePaths().map((guide) => join(root, guide))

const read = (path) => readFileSync(path, 'utf8')

test('every component has a guide and a story', () => {
  for (const name of components) {
    assert.ok(existsSync(join(componentsDir, `${name}.md`)), `${name}.md is missing`)
    assert.ok(
      existsSync(join(componentsDir, `${name}.stories.tsx`)),
      `${name}.stories.tsx is missing`,
    )
  }
})

test('every guide opens with its title, which the Docs page shows', () => {
  for (const file of markdownFiles) {
    assert.ok(read(file).startsWith('# '), `${file} does not start with a "# " title`)
  }
})

test('every component guide has the required sections', () => {
  for (const name of components) {
    const guide = read(join(componentsDir, `${name}.md`))

    for (const section of REQUIRED_SECTIONS) {
      assert.ok(guide.includes(`\n${section}\n`), `${name}.md misses "${section}"`)
    }
  }
})

test('every component story renders its guide on the Docs page', () => {
  for (const name of components) {
    const story = read(join(componentsDir, `${name}.stories.tsx`))

    assert.ok(
      story.includes(`from './${name}.md?raw'`),
      `${name}.stories.tsx does not import its guide`,
    )
    assert.ok(story.includes("tags: ['autodocs']"), `${name}.stories.tsx has no Docs page`)
  }
})

test('the README lists every component', () => {
  const readme = read(join(root, 'README.md'))

  for (const name of components) {
    assert.ok(readme.includes(`\`lago-ui/${name}\``), `README.md does not list lago-ui/${name}`)
  }
})

test('guides do not point to removed locations', () => {
  for (const file of markdownFiles) {
    const content = read(file)

    for (const reference of STALE_REFERENCES) {
      assert.ok(!content.includes(reference), `${file} references "${reference}"`)
    }
  }
})

test('the Storybook theme only uses v2 color tokens', () => {
  const tokens = read(join(root, 'src/styles/colors.css')).toUpperCase()
  const colors = read(join(root, '.storybook/theme.ts')).match(/#[0-9A-F]{6}/gi) ?? []

  for (const color of colors) {
    assert.ok(tokens.includes(`${color.toUpperCase()};`), `${color} is not a v2 token value`)
  }
})

test('relative links in guides resolve', () => {
  for (const file of markdownFiles) {
    const links = [...read(file).matchAll(/\]\((?!https?:)([^)#\s]+)/g)].map((match) => match[1])

    for (const link of links) {
      assert.ok(existsSync(resolve(dirname(file), link)), `${file} links to missing ${link}`)
    }
  }
})

test('the published AI docs keep every guide, its links and an llms.txt entry', () => {
  const outDir = mkdtempSync(join(tmpdir(), 'lago-ui-ai-docs-'))
  const baseUrl = 'https://example.test/ui/'

  buildAiDocs(outDir, baseUrl)
  const llms = read(join(outDir, 'llms.txt'))

  for (const guide of guidePaths()) {
    const published = join(outDir, guide)
    const links = [...read(published).matchAll(/\]\((?!https?:)([^)#\s]+)/g)].map(
      (match) => match[1],
    )

    assert.ok(llms.includes(`(${baseUrl}${guide})`), `llms.txt does not list ${guide}`)

    for (const link of links) {
      assert.ok(
        existsSync(resolve(dirname(published), link)),
        `${guide} links to unpublished ${link}`,
      )
    }
  }
})
