import { z } from 'zod'

import {
  PropertiesZodInput,
  validateChargeProperties,
} from '~/formValidation/chargePropertiesSchema'

function validate(chargeModel: string, props: Partial<PropertiesZodInput>, pathPrefix: string[]) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const issues: any[] = []
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ctx = { addIssue: (issue: any) => issues.push(issue), path: [] } as any as z.RefinementCtx

  validateChargeProperties(chargeModel, props as PropertiesZodInput, ctx, pathPrefix)
  return { isValid: issues.length === 0, issues }
}

describe('validateChargeProperties GraduatedPercentage', () => {
  describe('properties', () => {
    describe('invalid', () => {
      it('has undefined graduatedPercentageRange', () => {
        const result = validate('graduated_percentage', { graduatedPercentageRanges: undefined }, [
          'properties',
        ])

        expect(result.isValid).toBe(false)
      })
      it('has empty graduatedPercentageRange', () => {
        const result = validate('graduated_percentage', { graduatedPercentageRanges: [] }, [
          'properties',
        ])

        expect(result.isValid).toBe(false)
      })
      it('has NaN rate', () => {
        const result = validate(
          'graduated_percentage',
          {
            graduatedPercentageRanges: [{ fromValue: '0', toValue: '100', rate: 'a' }],
          },
          ['properties'],
        )

        expect(result.isValid).toBe(false)
      })
      it('has empty string rate', () => {
        const result = validate(
          'graduated_percentage',
          {
            graduatedPercentageRanges: [{ fromValue: '0', toValue: '100', rate: '' }],
          },
          ['properties'],
        )

        expect(result.isValid).toBe(false)
      })
      it('has null rate', () => {
        const result = validate(
          'graduated_percentage',
          {
            graduatedPercentageRanges: [
              { fromValue: '0', toValue: '100', rate: null as unknown as undefined },
            ],
          },
          ['properties'],
        )

        expect(result.isValid).toBe(false)
      })
      it('has undefined rate', () => {
        const result = validate(
          'graduated_percentage',
          {
            graduatedPercentageRanges: [{ fromValue: '0', toValue: '100', rate: undefined }],
          },
          ['properties'],
        )

        expect(result.isValid).toBe(false)
      })
      it('has fromValue bigger than toValue', () => {
        const result = validate(
          'graduated_percentage',
          {
            graduatedPercentageRanges: [{ fromValue: '100', toValue: '10', rate: '1' }],
          },
          ['properties'],
        )

        expect(result.isValid).toBe(false)
      })
      it('has fromValue equal to toValue', () => {
        const result = validate(
          'graduated_percentage',
          {
            graduatedPercentageRanges: [{ fromValue: '100', toValue: '100', rate: '1' }],
          },
          ['properties'],
        )

        expect(result.isValid).toBe(false)
      })
    })
    describe('valid', () => {
      it('has valid graduatedPercentageRange', () => {
        const result = validate(
          'graduated_percentage',
          {
            graduatedPercentageRanges: [
              { fromValue: '1', toValue: '100', rate: '1' },
              { fromValue: '101', toValue: '1000', rate: '1' },
            ],
          },
          ['properties'],
        )

        expect(result.isValid).toBe(true)
      })
    })
  })

  describe('filters (same validation, different path prefix)', () => {
    describe('invalid', () => {
      it('has undefined graduatedPercentageRange', () => {
        const result = validate('graduated_percentage', { graduatedPercentageRanges: undefined }, [
          'filters',
          '0',
          'properties',
        ])

        expect(result.isValid).toBe(false)
      })
      it('has empty graduatedPercentageRange', () => {
        const result = validate('graduated_percentage', { graduatedPercentageRanges: [] }, [
          'filters',
          '0',
          'properties',
        ])

        expect(result.isValid).toBe(false)
      })
      it('has NaN rate', () => {
        const result = validate(
          'graduated_percentage',
          {
            graduatedPercentageRanges: [{ fromValue: '0', toValue: '100', rate: 'a' }],
          },
          ['filters', '0', 'properties'],
        )

        expect(result.isValid).toBe(false)
      })
      it('has empty string rate', () => {
        const result = validate(
          'graduated_percentage',
          {
            graduatedPercentageRanges: [{ fromValue: '0', toValue: '100', rate: '' }],
          },
          ['filters', '0', 'properties'],
        )

        expect(result.isValid).toBe(false)
      })
      it('has null rate', () => {
        const result = validate(
          'graduated_percentage',
          {
            graduatedPercentageRanges: [
              { fromValue: '0', toValue: '100', rate: null as unknown as undefined },
            ],
          },
          ['filters', '0', 'properties'],
        )

        expect(result.isValid).toBe(false)
      })
      it('has fromValue bigger than toValue', () => {
        const result = validate(
          'graduated_percentage',
          {
            graduatedPercentageRanges: [{ fromValue: '100', toValue: '10', rate: '1' }],
          },
          ['filters', '0', 'properties'],
        )

        expect(result.isValid).toBe(false)
      })
      it('has fromValue equal to toValue', () => {
        const result = validate(
          'graduated_percentage',
          {
            graduatedPercentageRanges: [{ fromValue: '100', toValue: '100', rate: '1' }],
          },
          ['filters', '0', 'properties'],
        )

        expect(result.isValid).toBe(false)
      })
    })
    describe('valid', () => {
      it('has valid graduatedPercentageRange', () => {
        const result = validate(
          'graduated_percentage',
          {
            graduatedPercentageRanges: [
              { fromValue: '1', toValue: '100', rate: '1' },
              { fromValue: '101', toValue: '1000', rate: '1' },
            ],
          },
          ['filters', '0', 'properties'],
        )

        expect(result.isValid).toBe(true)
      })
    })
  })
})
