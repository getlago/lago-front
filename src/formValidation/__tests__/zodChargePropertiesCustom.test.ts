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

describe('validateChargeProperties Custom', () => {
  describe('properties', () => {
    describe('invalid', () => {
      it('has undefined customProperties', () => {
        const result = validate('custom', { customProperties: undefined }, ['properties'])

        expect(result.isValid).toBe(false)
      })
      it('has null customProperties', () => {
        const result = validate('custom', { customProperties: null }, ['properties'])

        expect(result.isValid).toBe(false)
      })
      it('has empty string customProperties', () => {
        const result = validate('custom', { customProperties: '' }, ['properties'])

        expect(result.isValid).toBe(false)
      })
      it('has invalid JSON string customProperties', () => {
        const result = validate('custom', { customProperties: 'not json' }, ['properties'])

        expect(result.isValid).toBe(false)
      })
      it('has array JSON customProperties', () => {
        const result = validate('custom', { customProperties: '[1, 2]' }, ['properties'])

        expect(result.isValid).toBe(false)
      })
      it('has string JSON customProperties', () => {
        const result = validate('custom', { customProperties: '"hello"' }, ['properties'])

        expect(result.isValid).toBe(false)
      })
    })
    describe('valid', () => {
      it('has valid JSON object string customProperties', () => {
        const result = validate('custom', { customProperties: '{"key": "value"}' }, ['properties'])

        expect(result.isValid).toBe(true)
      })
      it('has valid object customProperties', () => {
        const result = validate('custom', { customProperties: { key: 'value' } }, ['properties'])

        expect(result.isValid).toBe(true)
      })
      it('has empty object customProperties', () => {
        const result = validate('custom', { customProperties: '{}' }, ['properties'])

        expect(result.isValid).toBe(true)
      })
    })
  })
})
