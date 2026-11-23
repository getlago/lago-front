import { createHash } from 'node:crypto'
import { type Plugin } from 'vite'

import { BUILD_ID_FILE_NAME, BUILD_ID_LENGTH, BUILD_ID_META_NAME } from './buildId'

const INDEX_HTML = 'index.html'

type BundleFile = { fileName: string; content: string | Uint8Array }

// A hash of what the build ships: it changes with the served code even when APP_VERSION does
// not (OSS builds), and the amd64 and arm64 images of one release get the same id.
export const computeBuildId = (files: BundleFile[]): string => {
  const hash = createHash('sha256')

  for (const file of files.toSorted((a, b) => a.fileName.localeCompare(b.fileName))) {
    hash.update(file.fileName)
    hash.update('\0')
    hash.update(file.content)
    hash.update('\0')
  }

  return hash.digest('hex').slice(0, BUILD_ID_LENGTH)
}

export const injectBuildIdMeta = (html: string, buildId: string): string => {
  if (!html.includes('</head>')) {
    throw new Error(`[lago-build-id] ${INDEX_HTML} has no </head> to inject the build id into`)
  }

  return html.replace(
    '</head>',
    `<meta name="${BUILD_ID_META_NAME}" content="${buildId}" /></head>`,
  )
}

// Writes the same id into index.html (the build a tab runs) and version.json (the build
// being served now). One build produces both, so they never disagree for the same build.
export const buildIdPlugin = (): Plugin => ({
  name: 'lago-build-id',
  apply: 'build',
  // After Vite's own HTML plugin, so index.html is already in the bundle.
  enforce: 'post',
  generateBundle(_options, bundle) {
    const indexHtml = bundle[INDEX_HTML]

    if (!indexHtml || indexHtml.type !== 'asset') {
      throw new Error(`[lago-build-id] ${INDEX_HTML} is missing from the bundle`)
    }

    const files = Object.values(bundle)
      // index.html is rewritten below, and source maps only mirror the code.
      .filter(({ fileName }) => fileName !== INDEX_HTML && !fileName.endsWith('.map'))
      .map((file) => ({
        fileName: file.fileName,
        content: file.type === 'chunk' ? file.code : file.source,
      }))

    const buildId = computeBuildId(files)

    indexHtml.source = injectBuildIdMeta(indexHtml.source.toString(), buildId)

    this.emitFile({
      type: 'asset',
      fileName: BUILD_ID_FILE_NAME,
      source: JSON.stringify({ buildId }),
    })
  },
})
