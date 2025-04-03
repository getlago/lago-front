import { useMemo } from 'react'

import { ComboBox } from '~/components/form'
import { useGetBillingEntitiesQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { filterDataInlineSeparator, FiltersFormValues } from '../types'

type FiltersItemBillingEntityProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemBillingEntity = ({
  value,
  setFilterValue,
}: FiltersItemBillingEntityProps) => {
  const { translate } = useInternationalization()
  const { data, loading } = useGetBillingEntitiesQuery()

  const comboboxData = useMemo(() => {
    if (!data?.billingEntities?.collection) return []

    return data.billingEntities.collection.map((billingEntity) => ({
      label: billingEntity.name || billingEntity.code,
      value: `${billingEntity.id}${filterDataInlineSeparator}${billingEntity.name || billingEntity.code}`,
    }))
  }, [data])

  return (
    <ComboBox
      disableClearable
      loading={loading}
      placeholder={translate('text_174360002513391n72uwg6bb')}
      data={comboboxData}
      onChange={(billingEntityValue) => setFilterValue(billingEntityValue)}
      value={value}
    />
  )
}
