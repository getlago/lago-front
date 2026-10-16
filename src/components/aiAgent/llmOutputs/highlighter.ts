import { bundledLanguages, createHighlighter } from 'shiki/bundle/web'
import type { HighlighterCore } from 'shiki/core'
import catppuccinLatte from 'shiki/themes/catppuccin-latte.mjs'

let highlighterPromise: Promise<HighlighterCore> | undefined
const languagePromises = new Map<string, Promise<boolean>>()

export const getHighlighter = (): Promise<HighlighterCore> => {
  highlighterPromise ??= createHighlighter({
    langs: [],
    themes: [catppuccinLatte],
  }).catch((error: unknown) => {
    highlighterPromise = undefined
    throw error
  })

  return highlighterPromise
}

const loadLanguage = async (highlighter: HighlighterCore, language: string): Promise<boolean> => {
  if (Object.hasOwn(bundledLanguages, language)) {
    await highlighter.loadLanguage(bundledLanguages[language as keyof typeof bundledLanguages])
    return true
  }

  const { bundledLanguages: fullLanguages } = await import('shiki/bundle/full')

  if (!Object.hasOwn(fullLanguages, language)) return false

  await highlighter.loadLanguage(fullLanguages[language as keyof typeof fullLanguages])
  return true
}

export const ensureLanguage = (
  highlighter: HighlighterCore,
  language: string,
): Promise<boolean> => {
  if (
    ['text', 'plaintext', 'txt', 'ansi'].includes(language) ||
    highlighter.getLoadedLanguages().includes(language)
  ) {
    return Promise.resolve(true)
  }

  let promise = languagePromises.get(language)

  if (!promise) {
    promise = loadLanguage(highlighter, language).catch((error: unknown) => {
      languagePromises.delete(language)
      throw error
    })
    languagePromises.set(language, promise)
  }

  return promise
}
