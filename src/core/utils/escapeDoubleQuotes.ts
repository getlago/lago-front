// Linked-toast templates interpolate into a double-quoted `data-text` attribute.
export const escapeDoubleQuotes = (value: string): string => value.replaceAll('"', '&quot;')
