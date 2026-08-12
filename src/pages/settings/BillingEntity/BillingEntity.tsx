import { useParams } from 'react-router-dom'

import { MainHeader } from '~/components/MainHeader/MainHeader'
import { SETTINGS_ROUTE } from '~/core/router'
import { BillingEntity, LagoApiError, useGetBillingEntityQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useNotFoundRedirect } from '~/hooks/useNotFoundRedirect'
import BillingEntityMain from '~/pages/settings/BillingEntity/sections/BillingEntityMain'

export const BILLING_ENTITY_HEADER_TEST_ID = 'billing-entity-header'
export const BILLING_ENTITY_MAIN_TEST_ID = 'billing-entity-main'

const BillingEntityPage = () => {
  const { billingEntityCode } = useParams()
  const { translate } = useInternationalization()

  const {
    data: billingEntityData,
    loading: billingEntityLoading,
    error: billingEntityError,
  } = useGetBillingEntityQuery({
    variables: {
      code: billingEntityCode || '',
    },
    skip: !billingEntityCode,
    context: { silentErrorCodes: [LagoApiError.NotFound] },
  })

  const billingEntity = billingEntityData?.billingEntity

  useNotFoundRedirect({
    error: billingEntityError,
    loading: billingEntityLoading,
    redirectTo: SETTINGS_ROUTE,
    translateKey: 'text_17865284954420o93wb1ssqz',
  })

  return (
    <>
      <div data-test={BILLING_ENTITY_HEADER_TEST_ID}>
        <MainHeader.Configure
          entity={{
            viewName: billingEntity?.name || '',
            viewNameLoading: billingEntityLoading,
            metadata: translate('text_1742230191029w4pfyxjda2f'),
            metadataLoading: billingEntityLoading,
          }}
        />
      </div>

      {!billingEntityLoading && billingEntity && (
        <div data-test={BILLING_ENTITY_MAIN_TEST_ID}>
          <BillingEntityMain billingEntity={billingEntity as BillingEntity} />
        </div>
      )}
    </>
  )
}

export default BillingEntityPage
