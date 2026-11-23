import type { Rollup } from 'vite'

import { BUILD_ID_FILE_NAME, isBuildId } from '../buildId'
import { computeBuildId, injectBuildMeta, versionStampPlugin } from '../versionStampPlugin'

const HTML = '<!doctype html><html><head><title>Lago</title></head><body></body></html>'

describe('computeBuildId', () => {
  const files = [
    { fileName: 'assets/index-abc.js', content: 'console.log("a")' },
    { fileName: 'assets/index-abc.css', content: 'body{}' },
  ]

  it('returns a valid build id', () => {
    expect(isBuildId(computeBuildId(files))).toBe(true)
  })

  it('gives the same id for the same files, whatever their order', () => {
    expect(computeBuildId(files)).toBe(computeBuildId(files.toReversed()))
  })

  it('changes when a file content changes', () => {
    const changed = [{ ...files[0], content: 'console.log("b")' }, files[1]]

    expect(computeBuildId(changed)).not.toBe(computeBuildId(files))
  })

  it('changes when a file is renamed', () => {
    const renamed = [{ ...files[0], fileName: 'assets/index-def.js' }, files[1]]

    expect(computeBuildId(renamed)).not.toBe(computeBuildId(files))
  })

  it('does not let content shift between file names', () => {
    const a = [{ fileName: 'ab', content: 'c' }]
    const b = [{ fileName: 'a', content: 'bc' }]

    expect(computeBuildId(a)).not.toBe(computeBuildId(b))
  })

  it('accepts binary assets', () => {
    expect(
      isBuildId(computeBuildId([{ fileName: 'logo.png', content: new Uint8Array([1, 2]) }])),
    ).toBe(true)
  })
})

describe('injectBuildMeta', () => {
  const build = { id: '0123456789abcdef', builtAt: 1_000 }

  it('adds the meta tags to the head', () => {
    expect(injectBuildMeta(HTML, build)).toContain(
      '<meta name="lago-build-id" content="0123456789abcdef" />' +
        '<meta name="lago-built-at" content="1000" /></head>',
    )
  })

  it('fails the build when the html has no head', () => {
    expect(() => injectBuildMeta('<html></html>', build)).toThrow('</head>')
  })
})

describe('versionStampPlugin', () => {
  const runGenerateBundle = (bundle: Rollup.OutputBundle) => {
    const plugin = versionStampPlugin()
    const emitFile = jest.fn()
    const hook = plugin.generateBundle as (
      this: Pick<Rollup.PluginContext, 'emitFile'>,
      options: unknown,
      bundle: Rollup.OutputBundle,
    ) => void

    hook.call({ emitFile }, {}, bundle)

    return emitFile
  }

  const createBundle = (code: string): Rollup.OutputBundle =>
    ({
      'index.html': { type: 'asset', fileName: 'index.html', source: HTML },
      'assets/index-abc.js': { type: 'chunk', fileName: 'assets/index-abc.js', code },
      'assets/index-abc.js.map': {
        type: 'asset',
        fileName: 'assets/index-abc.js.map',
        source: '{}',
      },
    }) as unknown as Rollup.OutputBundle

  it('writes the same build into index.html and version.json', () => {
    const bundle = createBundle('console.log("a")')
    const emitFile = runGenerateBundle(bundle)

    const { fileName, source } = emitFile.mock.calls[0][0]
    const { buildId, builtAt } = JSON.parse(source)
    const html = (bundle['index.html'] as { source: string }).source

    expect(fileName).toBe(BUILD_ID_FILE_NAME)
    expect(isBuildId(buildId)).toBe(true)
    expect(html).toContain(`<meta name="lago-build-id" content="${buildId}" />`)
    expect(html).toContain(`<meta name="lago-built-at" content="${builtAt}" />`)
  })

  it('keeps the build time out of the id, so two builds of the same code share it', () => {
    const buildAt = (now: number) => {
      jest.spyOn(Date, 'now').mockReturnValue(now)

      return JSON.parse(runGenerateBundle(createBundle('console.log("a")')).mock.calls[0][0].source)
    }

    const first = buildAt(1_000)
    const second = buildAt(2_000)

    jest.restoreAllMocks()

    expect(first.builtAt).not.toBe(second.builtAt)
    expect(first.buildId).toBe(second.buildId)
  })

  it('ignores source maps', () => {
    const bundle = createBundle('console.log("a")')
    const otherMap = createBundle('console.log("a")')

    ;(otherMap['assets/index-abc.js.map'] as { source: string }).source = '{"changed":true}'

    const idOf = (b: Rollup.OutputBundle) =>
      JSON.parse(runGenerateBundle(b).mock.calls[0][0].source).buildId

    expect(idOf(bundle)).toBe(idOf(otherMap))
  })

  it('gives a different id when the code changes', () => {
    const idOf = (code: string) =>
      JSON.parse(runGenerateBundle(createBundle(code)).mock.calls[0][0].source).buildId

    expect(idOf('console.log("a")')).not.toBe(idOf('console.log("b")'))
  })

  it('gives a different id when only index.html changes', () => {
    const bundle = createBundle('console.log("a")')
    const otherHtml = createBundle('console.log("a")')

    ;(otherHtml['index.html'] as { source: string }).source = HTML.replace('Lago', 'Lago 2')

    const idOf = (b: Rollup.OutputBundle) =>
      JSON.parse(runGenerateBundle(b).mock.calls[0][0].source).buildId

    expect(idOf(bundle)).not.toBe(idOf(otherHtml))
  })

  it('fails the build when index.html is missing', () => {
    expect(() => runGenerateBundle({} as Rollup.OutputBundle)).toThrow('index.html')
  })
})
