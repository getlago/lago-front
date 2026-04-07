import { useStore } from '@tanstack/react-form'
import { createContext, ReactNode, useContext, useMemo } from 'react'

import { LocalChargeFilterInput } from '~/components/plans/types'
import { CurrencyEnum, PropertiesInput } from '~/generated/graphql'

interface ChargeFormContextValue {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any
  propertyCursor: string
  currency: CurrencyEnum
  disabled?: boolean
  chargePricingUnitShortName: string | undefined
}

const ChargeFormContext = createContext<ChargeFormContextValue | null>(null)

export const ChargeFormProvider = ({
  children,
  ...value
}: ChargeFormContextValue & { children: ReactNode }) => {
  const memoized = useMemo(
    () => value,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      value.form,
      value.propertyCursor,
      value.currency,
      value.disabled,
      value.chargePricingUnitShortName,
    ],
  )

  return <ChargeFormContext.Provider value={memoized}>{children}</ChargeFormContext.Provider>
}

export const useChargeFormContext = (): ChargeFormContextValue => {
  const ctx = useContext(ChargeFormContext)

  if (!ctx) throw new Error('useChargeFormContext must be used within a ChargeFormProvider')

  return ctx
}

/** Derive valuePointer reactively from the form store */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function usePropertyValues(form: any, propertyCursor: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useStore(form.store, (s: any) =>
    propertyCursor
      .split('.')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .reduce((obj: any, key: string) => obj?.[key], s.values),
  ) as PropertiesInput | LocalChargeFilterInput['properties'] | undefined
}
