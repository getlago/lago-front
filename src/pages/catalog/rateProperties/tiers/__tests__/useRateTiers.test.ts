import { act, renderHook } from '@testing-library/react'

import { RateTierInput } from '~/generated/graphql'

import { useRateTiers } from '../useRateTiers'

const createTier = (toValue: string | null): RateTierInput => ({
  toValue,
  perUnitAmount: '',
  flatAmount: '',
})

const tier = (toValue: string | null, perUnitAmount = '1'): RateTierInput => ({
  toValue,
  perUnitAmount,
  flatAmount: '0',
})

const renderTiers = (tiers: RateTierInput[] | undefined) => {
  const onChange = jest.fn()
  const view = renderHook(() => useRateTiers({ tiers, onChange, createTier }))

  return { ...view, onChange }
}

describe('useRateTiers', () => {
  describe('GIVEN no tiers yet', () => {
    it.each([undefined, []])(
      'WHEN the list is %p THEN seeds an up-to-1 tier and an open tier',
      (tiers) => {
        const { onChange } = renderTiers(tiers)

        expect(onChange).toHaveBeenCalledWith([createTier('1'), createTier(null)])
      },
    )
  })

  describe('GIVEN existing tiers', () => {
    describe('WHEN the hook mounts', () => {
      it('THEN does not seed and only protects the first row', () => {
        const { result, onChange } = renderTiers([tier('10'), tier(null)])

        expect(onChange).not.toHaveBeenCalled()
        expect(result.current.rows.map((row) => row.disabledDelete)).toEqual([true, false])
      })
    })

    describe('WHEN a tier is added', () => {
      it.each([
        [[tier(null, '2')], [createTier('1'), tier(null, '2')]],
        [
          [tier('10'), tier(null, '2')],
          [tier('10'), createTier('11'), tier(null, '2')],
        ],
        [
          [tier('10.5'), tier(null, '2')],
          [tier('10.5'), createTier('11.5'), tier(null, '2')],
        ],
        [
          [tier(''), tier(null, '2')],
          [tier(''), createTier('1'), tier(null, '2')],
        ],
      ])('THEN %j becomes %j', (tiers, expected) => {
        const { result, onChange } = renderTiers(tiers)

        act(() => result.current.addTier())

        expect(onChange).toHaveBeenCalledWith(expected)
      })
    })

    describe('WHEN a middle tier is deleted', () => {
      it('THEN the next tier starts where the previous one ends', () => {
        const { result, onChange } = renderTiers([tier('10'), tier('20'), tier(null)])

        act(() => result.current.deleteTier(1))

        expect(onChange).toHaveBeenCalledWith([tier('10'), tier(null)])
      })
    })

    describe('WHEN the open tier is deleted', () => {
      it('THEN the new last tier becomes open', () => {
        const { result, onChange } = renderTiers([
          tier('10', '1'),
          tier('20', '2'),
          tier(null, '3'),
        ])

        act(() => result.current.deleteTier(2))

        expect(onChange).toHaveBeenCalledWith([tier('10', '1'), tier(null, '2')])
      })

      it('THEN deleting down to one tier leaves a single open tier', () => {
        const { result, onChange } = renderTiers([tier('10', '1'), tier(null, '3')])

        act(() => result.current.deleteTier(1))

        expect(onChange).toHaveBeenCalledWith([tier(null, '1')])
      })
    })
  })
})
