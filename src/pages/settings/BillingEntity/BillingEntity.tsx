import { useParams } from 'react-router-dom'

import {
  SettingsListItemLoadingSkeleton,
  SettingsPaddedContainer,
} from '~/components/layouts/Settings'
import { BillingEntity, useGetBillingEntityQuery } from '~/generated/graphql'
import BillingEntityHeader from '~/pages/settings/BillingEntity/components/BillingEntityHeader'
import BillingEntityMain from '~/pages/settings/BillingEntity/sections/BillingEntityMain'

export enum BillingEntityTab {
  GENERAL,
  EMAIL_SCENARIOS,
  EMAIL_SCENARIOS_CONFIG,
  DUNNING_CAMPAIGNS,
  INVOICE_SETTINGS,
  INVOICE_CUSTOM_SECTIONS,
  TAXES,
}

export const BILLING_ENTITY_SETTINGS_TABS_LABELS: Record<BillingEntityTab, string> = {
  [BillingEntityTab.GENERAL]: 'text_1742230191029o8hfgeebxl5',
  [BillingEntityTab.EMAIL_SCENARIOS]: 'text_1742367202528mfhsv0f4fxq',
  [BillingEntityTab.EMAIL_SCENARIOS_CONFIG]: 'text_1742367202528mfhsv0f4fxq',
  [BillingEntityTab.DUNNING_CAMPAIGNS]: 'text_1742367202528ti8wj2iwa96',
  [BillingEntityTab.INVOICE_SETTINGS]: 'text_17423672025282dl7iozy1ru',
  [BillingEntityTab.INVOICE_CUSTOM_SECTIONS]: 'text_1749024634192ov41w9fp6r2',
  [BillingEntityTab.TAXES]: 'text_1742367202529opm80ylmp75',
}

const BillingEntityPage = () => {
  const { billingEntityCode } = useParams()

  const { data: billingEntityData, loading: billingEntityLoading } = useGetBillingEntityQuery({
    variables: {
      code: billingEntityCode || '',
    },
    skip: !billingEntityCode,
  })

  const billingEntity = billingEntityData?.billingEntity

  return (
    <>
      <BillingEntityHeader
        billingEntity={billingEntity as BillingEntity}
        loading={billingEntityLoading}
      />

      {billingEntityLoading && (
        <SettingsPaddedContainer className="mt-6">
          <SettingsListItemLoadingSkeleton count={5} />
        </SettingsPaddedContainer>
      )}

      {!billingEntityLoading && (
        <BillingEntityMain billingEntity={billingEntity as BillingEntity} />
      )}
    </>
  )
}

export default BillingEntityPage
