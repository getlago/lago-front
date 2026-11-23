export const middleTruncate = (
  text: string,
  availableWidth: number,
  measure: (value: string) => number,
): string => {
  if (measure(text) <= availableWidth) return text
  const segments = Array.from(
    new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text),
    ({ segment }) => segment,
  )

  if (segments.length <= 5) return text
  const suffix = segments.slice(-5).join('')

  if (measure(`…${suffix}`) > availableWidth) return suffix
  let low = 0
  let high = segments.length - 6

  while (low < high) {
    const middle = Math.ceil((low + high) / 2)

    if (measure(`${segments.slice(0, middle).join('')}…${suffix}`) <= availableWidth) low = middle
    else high = middle - 1
  }

  return `${segments.slice(0, low).join('')}…${suffix}`
}
