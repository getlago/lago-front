import { RatePercentageTierInput, RateTierInput } from '~/generated/graphql'

import {
  getGraduatedPercentageRateTiersLines,
  getGraduatedRateTiersExample,
  getVolumeRateTiersExample,
} from '../rateTiersCalculations'

const tier = (
  toValue: string | null,
  perUnitAmount: string,
  flatAmount: string,
): RateTierInput => ({
  toValue,
  perUnitAmount,
  flatAmount,
})

const percentageTier = (
  toValue: string | null,
  rate: string,
  flatAmount: string,
): RatePercentageTierInput => ({ toValue, rate, flatAmount })

describe('getGraduatedRateTiersExample', () => {
  describe('GIVEN a single open tier', () => {
    it('THEN prices a 10 units example', () => {
      expect(getGraduatedRateTiersExample([tier(null, '2', '1')])).toEqual({
        totalUnits: '10',
        total: 21,
        lines: [{ units: '10', perUnit: 2, flatFee: 1, total: 21 }],
      })
    })
  })

  describe('GIVEN the default tiers', () => {
    it('THEN prices one unit per tier and two units overall', () => {
      expect(getGraduatedRateTiersExample([tier('1', '', ''), tier(null, '', '')])).toEqual({
        totalUnits: '2',
        total: 0,
        lines: [
          { units: '1', perUnit: 0, flatFee: 0, total: 0 },
          { units: '1', perUnit: 0, flatFee: 0, total: 0 },
        ],
      })
    })
  })

  describe('GIVEN decimal bounds', () => {
    // Float subtraction printed 0.19999999999999998 units in plan v1.
    it('THEN counts units without float artifacts', () => {
      const example = getGraduatedRateTiersExample([
        tier('0.1', '1', '0'),
        tier('0.3', '1', '0'),
        tier(null, '1', '0'),
      ])

      expect(example.lines.map((line) => line.units)).toEqual(['0.1', '0.2', '1'])
      expect(example.totalUnits).toBe('1.3')
      expect(example.total).toBe(1.3)
    })
  })
})

describe('getVolumeRateTiersExample', () => {
  describe('GIVEN a single open tier', () => {
    it('THEN prices a 10 units example', () => {
      expect(getVolumeRateTiersExample([tier(null, '2', '1')])).toEqual({
        units: '10',
        perUnit: 2,
        flatFee: 1,
        total: 21,
      })
    })
  })

  describe('GIVEN several tiers', () => {
    it('THEN prices one unit above the last closed bound with the open tier', () => {
      expect(getVolumeRateTiersExample([tier('100', '1', '0'), tier(null, '0.2', '1')])).toEqual({
        units: '101',
        perUnit: 0.2,
        flatFee: 1,
        total: 21.2,
      })
    })
  })
})

describe('getGraduatedPercentageRateTiersLines', () => {
  describe('GIVEN several tiers', () => {
    it('THEN the first line names its bound and the next ones the previous bound', () => {
      expect(
        getGraduatedPercentageRateTiersLines([
          percentageTier('1000', '5', '1'),
          percentageTier(null, '3', '0'),
        ]),
      ).toEqual([
        { units: '1000', rate: 5, flatAmount: 1 },
        { units: '1000', rate: 3, flatAmount: 0 },
      ])
    })
  })

  describe('GIVEN a single open tier', () => {
    it('THEN returns one line', () => {
      expect(getGraduatedPercentageRateTiersLines([percentageTier(null, '3', '0')])).toEqual([
        { units: '0', rate: 3, flatAmount: 0 },
      ])
    })
  })
})
