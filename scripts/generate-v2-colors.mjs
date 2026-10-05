import { readFile, writeFile } from 'node:fs/promises'
import ts from 'typescript'

const source = await readFile(new URL('../src/styles/v2/colors.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
})
const { generateColorCss } = await import(
  `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
)
const target = new URL('../src/styles/v2/colors.css', import.meta.url)
const output = generateColorCss()

if (process.argv.includes('--check')) {
  if ((await readFile(target, 'utf8')) !== output) {
    throw new Error('Color CSS is stale. Run pnpm colors:generate')
  }
} else {
  await writeFile(target, output)
}
