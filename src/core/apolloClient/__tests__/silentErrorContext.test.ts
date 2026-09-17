import { DefaultContext } from '@apollo/client'

import { isSilencedGQLError, LagoGQLError, PspErrorCode } from '~/core/apolloClient/errorUtils'
import { LagoApiError } from '~/generated/graphql'

/**
 * Guard for the error-silencing context contract read by the global error link
 * (`src/core/apolloClient/init.ts`).
 *
 * `silentError` is a boolean meaning "report nothing on this operation, whatever
 * the error"; `silentErrorCodes` is the list of codes to silence. Because Apollo
 * declares `DefaultContext extends Record<string, any>`, passing a
 * `LagoApiError` to `silentError` used to compile — and silenced every error on
 * 15 operations, mutations included (LAGO-1844). The augmentation in
 * `src/core/apolloClient/apolloContext.d.ts` closes that hole.
 *
 * The `@ts-expect-error` assertions below are the regression guard: if the
 * augmentation ever stops applying — an Apollo upgrade moving `DefaultContext`,
 * the declaration file dropping out of the build — those comments become unused
 * and `pnpm types` fails. They are checked by the type-checker, not by jest.
 */
describe('silent error context', () => {
  describe('GIVEN the Apollo context type augmentation', () => {
    describe('WHEN a LagoApiError is passed to the boolean silentError flag', () => {
      it('THEN should not type-check', () => {
        const wrongScalar: DefaultContext = {
          // @ts-expect-error silentError is a boolean — use silentErrorCodes to silence one code
          silentError: LagoApiError.NotFound,
        }
        const wrongArray: DefaultContext = {
          // @ts-expect-error silentError is a boolean — use silentErrorCodes to silence one code
          silentError: [LagoApiError.NotFound],
        }

        expect([wrongScalar, wrongArray]).toHaveLength(2)
      })
    })

    describe('WHEN the documented shapes are used', () => {
      it('THEN should type-check', () => {
        const flag: DefaultContext = { silentError: true }
        const codes: DefaultContext = {
          silentErrorCodes: [LagoApiError.UnprocessableEntity, PspErrorCode.ThirdPartyError],
        }
        const details: DefaultContext = {
          silentErrorDetails: [LagoApiError.ValueAlreadyExist],
        }

        expect([flag, codes, details]).toHaveLength(3)
      })
    })
  })

  describe('GIVEN an operation silencing a single code', () => {
    const extensionsOf = (code: string): LagoGQLError['extensions'] =>
      ({ code }) as unknown as LagoGQLError['extensions']

    // The whole point of the fix: the intended code stays quiet, everything else
    // gets its Sentry event and its toast back.
    it.each([
      ['the silenced code', LagoApiError.UnprocessableEntity, true],
      ['an unrelated failure', LagoApiError.InternalError, false],
      ['a not-found', LagoApiError.NotFound, false],
    ])('THEN should silence %s: %s', (_label, code, expected) => {
      const context: DefaultContext = {
        silentErrorCodes: [LagoApiError.UnprocessableEntity],
      }

      expect(
        isSilencedGQLError({
          extensions: extensionsOf(code),
          silentErrorCodes: context.silentErrorCodes ?? [],
          silentErrorDetails: [],
        }),
      ).toBe(expected)
    })
  })
})
