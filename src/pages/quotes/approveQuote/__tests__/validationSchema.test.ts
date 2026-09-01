import { UNSUPPORTED_DATE_ERROR } from '~/core/constants/form'

import { approveQuoteValidationSchema, buildApproveQuoteVersionInput } from '../validationSchema'

describe('approveQuoteValidationSchema', () => {
  describe.each([
    ['expiresAt is omitted', undefined],
    ['expiresAt is the minimum supported instant', '1970-01-01T00:00:00.000Z'],
    ['expiresAt is well after the minimum', '2026-09-02T00:00:00.000Z'],
  ])('GIVEN %s', (_, expiresAt) => {
    describe('WHEN it is parsed', () => {
      it('THEN should report no issue', () => {
        expect(approveQuoteValidationSchema.safeParse({ expiresAt }).success).toBe(true)
      })
    })
  })

  // Regression (ING-634): this schema had no date rule at all, so a typed pre-1970 expiry
  // reached the API once the picker stopped withholding it.
  describe.each([
    ['a year with fewer than four digits', '0026-08-31T00:00:00.000Z'],
    ['the last instant before 1970', '1969-12-31T23:59:59.999Z'],
  ])('GIVEN expiresAt is %s', (_, expiresAt) => {
    describe('WHEN it is parsed', () => {
      it('THEN should report the unsupported-date issue on expiresAt', () => {
        const result = approveQuoteValidationSchema.safeParse({ expiresAt })

        expect(result.success).toBe(false)

        if (!result.success) {
          expect(result.error.issues).toEqual([
            expect.objectContaining({ path: ['expiresAt'], message: UNSUPPORTED_DATE_ERROR }),
          ])
        }
      })
    })
  })
})

describe('buildApproveQuoteVersionInput', () => {
  describe('GIVEN an expiry date', () => {
    describe('WHEN the input is built', () => {
      it('THEN should carry the version id and the end of that UTC day', () => {
        expect(
          buildApproveQuoteVersionInput('version-1', { expiresAt: '2026-09-02T10:00:00.000Z' }),
        ).toEqual({ id: 'version-1', expiresAt: '2026-09-02T23:59:59.999Z' })
      })
    })
  })

  describe('GIVEN no expiry date', () => {
    describe('WHEN the input is built', () => {
      it('THEN should leave expiresAt undefined', () => {
        expect(buildApproveQuoteVersionInput('version-1', { expiresAt: undefined })).toEqual({
          id: 'version-1',
          expiresAt: undefined,
        })
      })
    })
  })
})
