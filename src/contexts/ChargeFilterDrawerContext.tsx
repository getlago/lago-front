import { createContext, ReactNode, useContext, useMemo } from 'react'

import { ChargeModelEnum, CurrencyEnum } from '~/generated/graphql'

interface ChargeFilterDrawerContextValue {
  chargeModel: ChargeModelEnum
  chargeType: 'fixed' | 'usage'
  currency: CurrencyEnum
  chargePricingUnitShortName: string | undefined
}

const ChargeFilterDrawerContext = createContext<ChargeFilterDrawerContextValue | null>(null)

interface ChargeFilterDrawerProviderProps extends ChargeFilterDrawerContextValue {
  children: ReactNode
}

export const ChargeFilterDrawerProvider = ({
  chargeModel,
  chargeType,
  currency,
  chargePricingUnitShortName,
  children,
}: ChargeFilterDrawerProviderProps) => {
  const value = useMemo(
    () => ({ chargeModel, chargeType, currency, chargePricingUnitShortName }),
    [chargeModel, chargeType, currency, chargePricingUnitShortName],
  )

  return (
    <ChargeFilterDrawerContext.Provider value={value}>
      {children}
    </ChargeFilterDrawerContext.Provider>
  )
}

export const useChargeFilterDrawerContext = (): ChargeFilterDrawerContextValue => {
  const context = useContext(ChargeFilterDrawerContext)

  if (!context) {
    throw new Error('useChargeFilterDrawerContext must be used within a ChargeFilterDrawerProvider')
  }

  return context
}
