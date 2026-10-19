import { z } from 'zod'

import { CurrencyEnum } from '~/generated/graphql'

export const designSystemValidationSchema = z.object({
  amountCurrency: z.enum(CurrencyEnum),
  amountCents: z.union([z.number(), z.string().min(1)]),
  json: z.string().min(1),
  date: z.string().regex(/1992-05-26/, 'Sorry, you owe her a beer 🍺'),
  input: z.string().regex(/whatever/, "I thought you'd be more fun... 😏"),
  radio: z.string().regex(/whatever/, 'Really ? 🙄'),
  combobox: z.string().regex(/Mike/, "No, it's Mike 😡"),
  buttonSelector: z.string().regex(/whatever/, 'Interesting... '),
  inputNumber: z.string(),
  switch: z.boolean(),
  multipleCombobox: z.array(z.object({ value: z.string() })),
  checkboxCond1: z.boolean(),
  checkboxCond2: z.boolean(),
  jsonLong: z.string(),
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
