import { DEFAULT_ZOD_ERROR_MESSAGE } from '~/formValidation/initializeZod'
import { CurrencyEnum } from '~/generated/graphql'

import {
  designSystemFormDefaultValues,
  DesignSystemFormValues,
  designSystemValidationSchema,
} from '../validationSchema'

const validValues: DesignSystemFormValues = {
  ...designSystemFormDefaultValues,
  amountCents: 100,
  amountCurrency: CurrencyEnum.Eur,
  date: '1992-05-26',
  input: 'whatever',
  radio: 'whatever',
  combobox: 'Mike',
  buttonSelector: 'whatever',
}

const messageFor = (values: DesignSystemFormValues, path: string): string | undefined => {
  const result = designSystemValidationSchema.safeParse(values)

  return result.error?.issues.find((issue) => issue.path.join('.') === path)?.message
}

describe('designSystemValidationSchema', () => {
  describe('GIVEN every showcased answer is the expected one', () => {
    describe('WHEN the values are parsed', () => {
      it('THEN should report no issue', () => {
        expect(designSystemValidationSchema.safeParse(validValues).success).toBe(true)
      })
    })
  })

  describe('GIVEN an answer that is filled but wrong', () => {
    describe('WHEN the values are parsed', () => {
      it.each([
        ['date', '1992-05-27', 'Sorry, you owe her a beer 🍺'],
        ['input', 'something else', "I thought you'd be more fun... 😏"],
        ['radio', 'chocolatine', 'Really ? 🙄'],
        ['combobox', 'a-0', "No, it's Mike 😡"],
        ['buttonSelector', 'yoda', 'Interesting... '],
      ])('THEN should report the %s joke message', (path, value, message) => {
        expect(messageFor({ ...validValues, [path]: value }, path)).toBe(message)
      })
    })
  })

  describe('GIVEN the showcase default values', () => {
    // Unanswered is `undefined` on some fields and `''` on others; both read as required,
    // the way the deleted yup chain did, and neither leaks a joke message.
    describe('WHEN an answer has not been given', () => {
      it.each([['date'], ['combobox'], ['buttonSelector'], ['input'], ['radio']])(
        'THEN should report %s as required',
        (path) => {
          expect(messageFor(designSystemFormDefaultValues, path)).toBe(DEFAULT_ZOD_ERROR_MESSAGE)
        },
      )
    })
  })

  describe('GIVEN an amount', () => {
    describe('WHEN it is a number or a numeric string', () => {
      it.each([[42], ['42'], ['4.2']])('THEN should accept %p', (amountCents) => {
        expect(messageFor({ ...validValues, amountCents }, 'amountCents')).toBeUndefined()
      })
    })

    describe('WHEN it is empty or not a number', () => {
      it.each([[undefined], [''], ['abc']])('THEN should reject %p', (amountCents) => {
        expect(messageFor({ ...validValues, amountCents }, 'amountCents')).toBeDefined()
      })
    })
  })

  describe('GIVEN the JSON editor content', () => {
    describe('WHEN it is cleared', () => {
      it('THEN should reject the required editor', () => {
        expect(messageFor({ ...validValues, json: '' }, 'json')).toBeDefined()
      })

      it('THEN should accept the optional editor', () => {
        expect(messageFor({ ...validValues, jsonLong: '' }, 'jsonLong')).toBeUndefined()
      })
    })

    // Guards the Formik wrapper's `onError` wiring, which the TanStack wrapper does not carry:
    // without this rule malformed JSON reaches the form with no error at all.
    describe('WHEN it holds malformed JSON', () => {
      it.each([['json'], ['jsonLong']])(
        'THEN should reject %s with the editor own invalid message',
        (path) => {
          expect(messageFor({ ...validValues, [path]: '{ "age": ' }, path)).toBe('invalid')
        },
      )
    })

    describe('WHEN it holds parsable JSON', () => {
      it.each([['json'], ['jsonLong']])('THEN should accept %s', (path) => {
        expect(messageFor({ ...validValues, [path]: '{ "age": 41 }' }, path)).toBeUndefined()
      })
    })
  })
})
