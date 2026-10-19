import { z } from 'zod'

import { DEFAULT_ZOD_ERROR_MESSAGE } from '~/formValidation/initializeZod'
import { CurrencyEnum } from '~/generated/graphql'

// `JSON_EDITOR_ERROR_ENUM.invalid` in JsonEditor.tsx: the editor renders its own
// malformed-JSON copy only when the field error is exactly this string.
const JSON_EDITOR_INVALID_ERROR = 'invalid'

const isParsableJson = (value: string): boolean => {
  if (!value) return true

  try {
    JSON.parse(value)

    return true
  } catch {
    return false
  }
}

// Not `.min(1).regex(…)`: zod runs every check and would stack both messages on an empty
// value, where the deleted yup chain stopped at `required`.
const requiredMatching = (pattern: RegExp, message: string): z.ZodType<string, string> =>
  z.string().superRefine((value, ctx) => {
    if (!value) {
      ctx.addIssue({ code: 'custom', message: DEFAULT_ZOD_ERROR_MESSAGE })

      return
    }

    if (!pattern.test(value)) {
      ctx.addIssue({ code: 'custom', message })
    }
  })

const isNumericAmount = (value: string | number): boolean =>
  typeof value === 'number' || (value !== '' && Number.isFinite(Number(value)))

export const designSystemValidationSchema = z.object({
  amountCurrency: z.enum(CurrencyEnum),
  amountCents: z.union([z.number(), z.string()]).refine(isNumericAmount),
  json: z.string().min(1).refine(isParsableJson, JSON_EDITOR_INVALID_ERROR),
  date: requiredMatching(/1992-05-26/, 'Sorry, you owe her a beer 🍺'),
  input: requiredMatching(/whatever/, "I thought you'd be more fun... 😏"),
  radio: requiredMatching(/whatever/, 'Really ? 🙄'),
  combobox: requiredMatching(/Mike/, "No, it's Mike 😡"),
  buttonSelector: requiredMatching(/whatever/, 'Interesting... '),
  inputNumber: z.string(),
  switch: z.boolean(),
  multipleCombobox: z.array(z.object({ value: z.string() })),
  checkboxCond1: z.boolean(),
  checkboxCond2: z.boolean(),
  jsonLong: z.string().refine(isParsableJson, JSON_EDITOR_INVALID_ERROR),
})

export type DesignSystemFormValues = {
  amountCents: string | number | undefined
  amountCurrency: CurrencyEnum
  date: string | undefined
  input: string
  inputNumber: string
  switch: boolean
  combobox: string | undefined
  multipleCombobox: { value: string }[]
  radio: string
  buttonSelector: string | undefined
  checkboxCond1: boolean
  checkboxCond2: boolean
  json: string
  jsonLong: string
}

export const designSystemFormDefaultValues: DesignSystemFormValues = {
  amountCents: undefined,
  amountCurrency: CurrencyEnum.Usd,
  date: undefined,
  input: '',
  inputNumber: '',
  switch: true,
  combobox: undefined,
  multipleCombobox: [],
  radio: '',
  buttonSelector: undefined,
  checkboxCond1: true,
  checkboxCond2: true,
  json: JSON.stringify(
    {
      age: '41 years old',
      home: {
        country: 'United States',
        address: '317 example street',
      },
      friends: [],
    },
    null,
    2,
  ),
  jsonLong: JSON.stringify(
    {
      age: '41 years old',
      home: {
        country: 'United States',
        address: '317 example street',
      },
      friends: [
        'Lucille, Ellissa',
        'Korry, Shawn',
        'Auguste, Gina',
        'Guinna, Aime',
        'Faustine, Rozalie',
      ],
    },
    null,
    2,
  ),
}
