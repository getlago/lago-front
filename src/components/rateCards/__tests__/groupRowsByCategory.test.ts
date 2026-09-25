import { groupRowsByCategory } from '../groupRowsByCategory'
import { AppliedRateCardRow } from '../types'

const buildRow = (id: string, categoryId: string | null): AppliedRateCardRow => ({
  id,
  ratePhasesCount: 1,
  product: {
    id: `product-${id}`,
    name: `Product ${id}`,
    invoiceDisplayName: null,
    productCategory: categoryId
      ? { id: categoryId, name: `Category ${categoryId}`, invoiceDisplayName: null }
      : null,
  },
  rateCard: { id: `rc-${id}`, name: `Rate card ${id}`, code: `rc_${id}`, productFilter: null },
})

const ids = (rows: AppliedRateCardRow[]): string[] => rows.map((row) => row.id)

describe('groupRowsByCategory', () => {
  describe('GIVEN rows of one category arriving split by another category', () => {
    it('THEN gathers them in first-seen group order, keeping row order inside each group', () => {
      const rows = [buildRow('1', 'a'), buildRow('2', 'b'), buildRow('3', 'a'), buildRow('4', 'b')]

      expect(ids(groupRowsByCategory(rows))).toEqual(['1', '3', '2', '4'])
    })
  })

  describe('GIVEN standalone rows interleaved with categorised rows', () => {
    it('THEN places every standalone row after all the categories', () => {
      const rows = [
        buildRow('1', null),
        buildRow('2', 'a'),
        buildRow('3', null),
        buildRow('4', 'b'),
      ]

      expect(ids(groupRowsByCategory(rows))).toEqual(['2', '4', '1', '3'])
    })
  })

  describe('GIVEN an empty page', () => {
    it('THEN returns an empty list', () => {
      expect(groupRowsByCategory([])).toEqual([])
    })
  })
})
