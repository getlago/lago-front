export enum ValueFormatter {
  int = 'int',
  decimal = 'decimal', // Truncate numbers to 2 decimals
  triDecimal = 'triDecimal', // Truncate numbers to 3 decimals
  quadDecimal = 'quadDecimal', // Truncate numbers to 4 decimals
  sextDecimal = 'sextDecimal', // Truncate numbers to 6 decimals
  positiveNumber = 'positiveNumber',
  code = 'code', // Replace all the spaces by "_"
  chargeDecimal = 'chargeDecimal', // Truncate charge numbers to 15 decimals
  lowercase = 'lowercase',
  trim = 'trim',
  dashSeparator = 'dashSeparator',
}

export type ValueFormatterType = keyof typeof ValueFormatter
const numberFormatter = new RegExp(
  `${ValueFormatter.int}|${ValueFormatter.decimal}|${ValueFormatter.triDecimal}|${ValueFormatter.quadDecimal}|${ValueFormatter.sextDecimal}|${ValueFormatter.positiveNumber}`,
)

type FormatterFunctions = ValueFormatterType[] | ValueFormatterType

const DECIMAL_TRUNCATIONS: ReadonlyArray<readonly [ValueFormatterType, RegExp]> = [
  [ValueFormatter.decimal, /^-?\d+(?:\.\d{0,2})?/],
  [ValueFormatter.triDecimal, /^-?\d+(?:\.\d{0,3})?/],
  [ValueFormatter.quadDecimal, /^-?\d+(?:\.\d{0,4})?/],
  [ValueFormatter.sextDecimal, /^-?\d+(?:\.\d{0,6})?/],
  [ValueFormatter.chargeDecimal, /^-?\d+(?:\.\d{0,15})?/],
]

const TEXT_TRANSFORMS: ReadonlyArray<readonly [ValueFormatterType, (value: string) => string]> = [
  [ValueFormatter.code, (value) => value.replace(/\s/g, '_')],
  [ValueFormatter.lowercase, (value) => value.toLowerCase()],
  [ValueFormatter.trim, (value) => value.trim()],
  [ValueFormatter.dashSeparator, (value) => value.replaceAll(' ', '-').replaceAll('_', '-')],
]

const hasNumberFormatter = (formatterFunctions: FormatterFunctions): boolean =>
  numberFormatter.test(
    typeof formatterFunctions === 'string' ? formatterFunctions : formatterFunctions.join(''),
  )

const applyNumericFormatters = (value: string, formatterFunctions: FormatterFunctions): string => {
  // A lone '-' is a valid intermediate state: the user is typing a negative number.
  if (value === '-') return value

  let formatted = value

  if (formatterFunctions.includes(ValueFormatter.int)) {
    const parsed = Number.parseInt(formatted)

    formatted = Number.isNaN(parsed) ? '' : String(parsed)
  }

  DECIMAL_TRUNCATIONS.forEach(([formatter, truncation]) => {
    if (formatterFunctions.includes(formatter)) {
      formatted = truncation.exec(formatted)?.[0] ?? ''
    }
  })

  return formatted
}

export const formatValue = (
  value: string | number | undefined,
  formatterFunctions?: FormatterFunctions,
): string | null => {
  if (value === undefined || value === null || value === '') return ''

  let formattedValue = String(value)

  if (!formatterFunctions?.length) return formattedValue

  if (
    hasNumberFormatter(formatterFunctions) &&
    Number.isNaN(Number(formattedValue.replace(/[.-]/g, '')))
  ) {
    return null
  }

  if (formatterFunctions.includes(ValueFormatter.positiveNumber)) {
    formattedValue = formattedValue.replace('-', '')
  }

  formattedValue = applyNumericFormatters(formattedValue, formatterFunctions)

  TEXT_TRANSFORMS.forEach(([formatter, transform]) => {
    if (formatterFunctions.includes(formatter)) {
      formattedValue = transform(formattedValue)
    }
  })

  return formattedValue
}
