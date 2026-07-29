import { z } from 'zod'

import { DEFAULT_ZOD_ERROR_MESSAGE, initializeZod } from '~/formValidation/initializeZod'

const EXPLICIT_MESSAGE = 'explicit-message'

const firstMessageOf = (schema: z.ZodType, value: unknown): string | undefined => {
  const result = schema.safeParse(value)

  return result.success ? undefined : result.error.issues[0]?.message
}

describe('initializeZod', () => {
  // `jest-setup.ts` already initializes Zod globally, so restore that state after each
  // test to avoid leaking a reset config into the rest of the suite.
  afterEach(() => {
    initializeZod()
  })

  describe('GIVEN Zod has not been initialized', () => {
    describe('WHEN a validation without an explicit message fails', () => {
      it('THEN should fall back to the built-in Zod message', () => {
        z.config({ customError: undefined })

        expect(firstMessageOf(z.string().min(1), '')).not.toBe(DEFAULT_ZOD_ERROR_MESSAGE)
      })
    })
  })

  describe('GIVEN the module is freshly imported', () => {
    describe('WHEN nothing calls the init function', () => {
      it('THEN should already have registered the default message', () => {
        jest.isolateModules(() => {
          // A module registry of its own, so this is a pristine Zod whose config can
          // only come from importing the module under test.
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const isolatedZod = require('zod').z

          // eslint-disable-next-line @typescript-eslint/no-require-imports
          require('~/formValidation/initializeZod')

          const result = isolatedZod.string().min(1).safeParse('')

          expect(result.error?.issues[0]?.message).toBe(DEFAULT_ZOD_ERROR_MESSAGE)
        })
      })
    })
  })

  describe('GIVEN Zod has been initialized', () => {
    beforeEach(() => {
      initializeZod()
    })

    describe('WHEN a validation without an explicit message fails', () => {
      it.each([
        ['a missing required string', z.string().min(1), ''],
        ['a value of the wrong type', z.string(), 42],
        ['a missing object key', z.object({ name: z.string() }), {}],
        ['an empty array', z.array(z.string()).min(1), []],
        ['a malformed email', z.email(), 'not-an-email'],
        ['a failing refinement', z.string().refine((value) => value === 'ok'), 'ko'],
        [
          'a custom issue added without a message',
          z.string().superRefine((_value, ctx) => ctx.addIssue({ code: 'custom' })),
          'anything',
        ],
      ])('THEN should use the default error message for %s', (_, schema, value) => {
        expect(firstMessageOf(schema, value)).toBe(DEFAULT_ZOD_ERROR_MESSAGE)
      })

      it('THEN should use the default error message for every failing field of an object', () => {
        const schema = z.object({ name: z.string().min(1), code: z.string().min(1) })

        const result = schema.safeParse({ name: '', code: '' })

        expect(result.success).toBe(false)
        expect(result.error?.issues.map((issue) => issue.message)).toEqual([
          DEFAULT_ZOD_ERROR_MESSAGE,
          DEFAULT_ZOD_ERROR_MESSAGE,
        ])
      })
    })

    describe('WHEN a validation defines its own message', () => {
      it.each([
        ['a string shorthand', z.string().min(1, EXPLICIT_MESSAGE), ''],
        ['a message object', z.string().min(1, { message: EXPLICIT_MESSAGE }), ''],
        [
          'a refinement message',
          z.string().refine((value) => value === 'ok', EXPLICIT_MESSAGE),
          'ko',
        ],
        [
          'a custom issue message',
          z
            .string()
            .superRefine((_value, ctx) =>
              ctx.addIssue({ code: 'custom', message: EXPLICIT_MESSAGE }),
            ),
          'anything',
        ],
      ])('THEN should keep the explicit message of %s', (_, schema, value) => {
        expect(firstMessageOf(schema, value)).toBe(EXPLICIT_MESSAGE)
      })
    })

    describe('WHEN a valid value is parsed', () => {
      it('THEN should not produce any error', () => {
        expect(z.string().min(1).safeParse('value').success).toBe(true)
      })
    })
  })
})
