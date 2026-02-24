import { createContext, ReactNode, useContext } from 'react'

import { CurrencyEnum, PlanInterval } from '~/generated/graphql'

interface PlanFormContextValue {
  currency: CurrencyEnum
  interval: PlanInterval
}

const PlanFormContext = createContext<PlanFormContextValue | null>(null)

interface PlanFormProviderProps extends PlanFormContextValue {
  children: ReactNode
}

export const PlanFormProvider = ({ currency, interval, children }: PlanFormProviderProps) => {
  return (
    <PlanFormContext.Provider value={{ currency, interval }}>{children}</PlanFormContext.Provider>
  )
}

export const usePlanFormContext = (): PlanFormContextValue => {
  const context = useContext(PlanFormContext)

  if (!context) {
    throw new Error('usePlanFormContext must be used within a PlanFormProvider')
  }

  return context
}
