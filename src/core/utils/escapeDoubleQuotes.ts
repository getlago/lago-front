/**
 * `data-text` is a double-quoted HTML attribute in the linked-toast templates, so an entity
 * name reaching one must not be able to break out of it.
 */
export const escapeDoubleQuotes = (value: string): string => value.replaceAll('"', '&quot;')
