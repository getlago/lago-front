export const obfuscateValue = (
  value: string,
  options: { prefixLength: number } = {
    prefixLength: 8,
  },
) => `${'•'.repeat(options.prefixLength)}${value.slice(-3)}`
