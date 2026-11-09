import { copyFileSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const LINK = /\]\((?!https?:)([^)#\s]+)/g

const read = (path) => readFileSync(path, 'utf8')

export const guidePaths = () => [
  'README.md',
  ...['src/components', 'src/styles'].flatMap((dir) =>
    readdirSync(join(root, dir))
      .filter((file) => file.endsWith('.md'))
      .map((file) => `${dir}/${file}`),
  ),
]

const linkedFiles = (guide) =>
  [...read(join(root, guide)).matchAll(LINK)].map((match) =>
    relative(root, resolve(root, dirname(guide), match[1])),
  )

const plainText = (markdown) =>
  markdown
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\*\*/g, '')
    .trim()

const title = (guide) => read(join(root, guide)).split('\n')[0].replace(/^# /, '')

const summary = (guide) => {
  const [, ...lines] = read(join(root, guide)).split('\n')
  const start = lines.findIndex((line) => line.trim())
  const end = lines.findIndex((line, index) => index > start && !line.trim())

  return plainText(lines.slice(start, end).join(' '))
}

const readmeTable = (heading) => {
  const lines = read(join(root, 'README.md')).split('\n')
  const start = lines.indexOf(heading)
  const rows = []

  for (const line of lines.slice(start + 1)) {
    if (rows.length && !line.startsWith('|')) break
    if (!line.startsWith('|') || line.startsWith('| ---')) continue

    rows.push(
      line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim()),
    )
  }

  return rows.slice(1)
}

const guideOf = (cell) => cell.match(/\]\(([^)]+)\)/)[1]

const llmsTxt = (baseUrl) => {
  const url = (path) => new URL(path, baseUrl).href
  const components = readmeTable('## Components').map(
    ([name, importPath, guide]) =>
      `- [${name}](${url(guideOf(guide))}): ${summary(guideOf(guide))} Import: ${importPath}.`,
  )
  const foundations = readmeTable('## Foundations').map(
    ([topic, guide]) => `- [${title(guideOf(guide))}](${url(guideOf(guide))}): ${topic}.`,
  )

  return [
    '# Lago UI',
    '',
    '> The v2 design system of lago-front: React components built on Radix, CVA and Tailwind, with the v2 tokens. Read the README first, then the guide of every component you use.',
    '',
    `Every link below is plain Markdown. The interactive Storybook, for humans, is at ${baseUrl}.`,
    '',
    '## Start here',
    '',
    `- [README](${url('README.md')}): when to use v2, the rules, and the index of components and foundations.`,
    '',
    '## Components',
    '',
    ...components,
    '',
    '## Foundations',
    '',
    ...foundations,
    '',
  ].join('\n')
}

export const buildAiDocs = (outDir, baseUrl) => {
  const guides = guidePaths()
  const files = new Set([...guides, ...guides.flatMap(linkedFiles)])

  for (const file of files) {
    mkdirSync(dirname(join(outDir, file)), { recursive: true })
    copyFileSync(join(root, file), join(outDir, file))
  }

  writeFileSync(join(outDir, 'llms.txt'), llmsTxt(baseUrl))
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [outDir, baseUrl] = process.argv.slice(2)

  if (!outDir || !baseUrl?.endsWith('/')) {
    throw new Error('Usage: node scripts/build-ai-docs.mjs <outDir> <baseUrl ending with />')
  }

  buildAiDocs(resolve(outDir), baseUrl)
}
