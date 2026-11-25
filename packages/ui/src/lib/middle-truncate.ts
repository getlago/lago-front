const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

export const middleTruncate = (value: string, fits: (candidate: string) => boolean): string => {
  if (fits(value)) return value
  const characters = Array.from(segmenter.segment(value), (part) => part.segment)

  if (characters.length <= 5) return value
  const suffix = characters.slice(-5).join('')
  let low = 0
  let high = characters.length - 6

  while (low < high) {
    const midpoint = Math.ceil((low + high) / 2)

    if (fits(`${characters.slice(0, midpoint).join('')}…${suffix}`)) low = midpoint
    else high = midpoint - 1
  }
  return `${characters.slice(0, low).join('')}…${suffix}`
}
