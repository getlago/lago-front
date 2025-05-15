import { useEffect } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import { BILLING_ENTITY_ROUTE } from '~/core/router'
import { useGetBillingEntitiesQuery } from '~/generated/graphql'

const SettingsHomePage = () => {
  const navigate = useNavigate()

  const { data: billingEntitiesData } = useGetBillingEntitiesQuery()

  useEffect(() => {
    if (!billingEntitiesData?.billingEntities?.collection?.length) {
      return
    }

    const defaultBillingEntity = billingEntitiesData?.billingEntities?.collection?.find(
      (b) => b.isDefault,
    )

    if (!defaultBillingEntity?.code) {
      return
    }

    return navigate(
      generatePath(BILLING_ENTITY_ROUTE, {
        billingEntityCode: defaultBillingEntity.code,
      }),
    )
  }, [billingEntitiesData, navigate])

  return null
}

export default SettingsHomePage
