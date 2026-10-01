import { useEffect, useMemo } from 'react'

import { getNextTierUpTo } from './rateTiers'

type RateTierBase = { toValue?: string | null }

type RateTierRow<TTier extends RateTierBase> = TTier & { disabledDelete: boolean }

type UseRateTiersArgs<TTier extends RateTierBase> = {
  tiers: TTier[] | null | undefined
  onChange: (tiers: TTier[]) => void
  createTier: (toValue: string | null) => TTier
}

type UseRateTiersReturn<TTier extends RateTierBase> = {
  rows: RateTierRow<TTier>[]
  addTier: () => void
  deleteTier: (index: number) => void
}

export const useRateTiers = <TTier extends RateTierBase>({
  tiers,
  onChange,
  createTier,
}: UseRateTiersArgs<TTier>): UseRateTiersReturn<TTier> => {
  const currentTiers = useMemo(() => tiers ?? [], [tiers])

  useEffect(() => {
    if (currentTiers.length) return

    onChange([createTier('1'), createTier(null)])
  }, [currentTiers, onChange, createTier])

  const rows = useMemo(
    () => currentTiers.map((tier, index) => ({ ...tier, disabledDelete: index === 0 })),
    [currentTiers],
  )

  const addTier = (): void => {
    const insertAt = Math.max(currentTiers.length - 1, 0)

    onChange([
      ...currentTiers.slice(0, insertAt),
      createTier(getNextTierUpTo(currentTiers)),
      ...currentTiers.slice(insertAt),
    ])
  }

  const deleteTier = (index: number): void => {
    const remainingTiers = currentTiers.filter((_, tierIndex) => tierIndex !== index)
    const lastIndex = remainingTiers.length - 1

    if (index === currentTiers.length - 1 && lastIndex >= 0) {
      remainingTiers[lastIndex] = { ...remainingTiers[lastIndex], toValue: null }
    }

    onChange(remainingTiers)
  }

  return { rows, addTier, deleteTier }
}
