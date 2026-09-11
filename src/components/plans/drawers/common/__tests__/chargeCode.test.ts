import { buildChargeCodeSchema, seedChargeCode } from '../chargeCode'

describe('chargeCode helpers', () => {
  describe('buildChargeCodeSchema', () => {
    describe('WHEN requireCode is true', () => {
      const schema = buildChargeCodeSchema(true)

      it('THEN rejects an empty string', () => {
        expect(schema.safeParse('').success).toBe(false)
      })

      it('THEN accepts a non-empty string', () => {
        expect(schema.safeParse('setup_fee').success).toBe(true)
      })
    })

    describe('WHEN requireCode is false', () => {
      const schema = buildChargeCodeSchema(false)

      it('THEN accepts an empty string', () => {
        expect(schema.safeParse('').success).toBe(true)
      })
    })
  })

  describe('seedChargeCode', () => {
    it('does nothing when disabled', () => {
      const setCode = jest.fn()

      seedChargeCode({
        enabled: false,
        sourceCode: 'setup',
        existingChargeCodes: [],
        setCode,
      })

      expect(setCode).not.toHaveBeenCalled()
    })

    it('seeds the source code when there is no collision', () => {
      const setCode = jest.fn()

      seedChargeCode({
        enabled: true,
        sourceCode: 'setup',
        existingChargeCodes: ['other'],
        setCode,
      })

      expect(setCode).toHaveBeenCalledWith('setup')
    })

    it('appends a numeric suffix when the source code already exists', () => {
      const setCode = jest.fn()

      seedChargeCode({
        enabled: true,
        sourceCode: 'setup',
        existingChargeCodes: ['setup', 'setup_2'],
        setCode,
      })

      expect(setCode).toHaveBeenCalledWith('setup_3')
    })

    it('treats undefined existingChargeCodes as an empty list', () => {
      const setCode = jest.fn()

      seedChargeCode({
        enabled: true,
        sourceCode: 'setup',
        existingChargeCodes: undefined,
        setCode,
      })

      expect(setCode).toHaveBeenCalledWith('setup')
    })
  })
})
