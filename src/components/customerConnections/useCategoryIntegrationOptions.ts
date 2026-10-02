import { useMemo } from 'react'

import { ConnectionComboBoxDataItem } from '~/components/customerConnections/ConnectionComboBox'
import {
  ConnectionCategory,
  IntegrationConnectionCategory,
} from '~/components/customerConnections/types'
import { useAccountingProviders } from '~/components/customerConnections/useAccountingProviders'
import { useCrmProviders } from '~/components/customerConnections/useCrmProviders'
import { useTaxProviders } from '~/components/customerConnections/useTaxProviders'

type IntegrationOptionSource = {
  code: string
  name: string
  __typename?: string
}

export const toIntegrationConnectionOptions = (
  integrations: IntegrationOptionSource[] = [],
): ConnectionComboBoxDataItem[] =>
  integrations.map((integration) => ({
    value: integration.code,
    label: integration.name,
    subLabel: integration.code,
    group: integration.__typename?.replace('Integration', '') || '',
  }))

interface UseCategoryIntegrationOptionsArgs {
  category: IntegrationConnectionCategory
  skip?: boolean
}

interface UseCategoryIntegrationOptionsReturn {
  options: ConnectionComboBoxDataItem[]
  isLoading: boolean
}

export const useCategoryIntegrationOptions = ({
  category,
  skip = false,
}: UseCategoryIntegrationOptionsArgs): UseCategoryIntegrationOptionsReturn => {
  const { accountingProviders, isLoadingAccountProviders } = useAccountingProviders({
    skip: skip || category !== ConnectionCategory.Accounting,
  })
  const { crmProviders, isLoadingCrmProviders } = useCrmProviders({
    skip: skip || category !== ConnectionCategory.Crm,
  })
  const { taxProviders, isLoadingTaxProviders } = useTaxProviders({
    skip: skip || category !== ConnectionCategory.Tax,
  })

  const collection = {
    [ConnectionCategory.Accounting]: accountingProviders?.integrations?.collection,
    [ConnectionCategory.Crm]: crmProviders?.integrations?.collection,
    [ConnectionCategory.Tax]: taxProviders?.integrations?.collection,
  }[category]

  const isLoading = {
    [ConnectionCategory.Accounting]: isLoadingAccountProviders,
    [ConnectionCategory.Crm]: isLoadingCrmProviders,
    [ConnectionCategory.Tax]: isLoadingTaxProviders,
  }[category]

  const options = useMemo(
    () =>
      toIntegrationConnectionOptions(
        (collection || []).flatMap((integration) =>
          'code' in integration && 'name' in integration
            ? [
                {
                  code: integration.code,
                  name: integration.name,
                  __typename: integration.__typename,
                },
              ]
            : [],
        ),
      ),
    [collection],
  )

  return { options, isLoading }
}
