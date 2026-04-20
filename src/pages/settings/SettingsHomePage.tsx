import { useEffect } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { Spinner } from '~/components/designSystem/Spinner'
import { BILLING_ENTITY_ROUTE } from '~/core/router'
import { useGetBillingEntitiesQuery } from '~/generated/graphql'

const SettingsHomePage = () => {
  const navigate = useNavigate()
  const { organizationSlug } = useParams<{ organizationSlug: string }>()

  const { data: billingEntitiesData } = useGetBillingEntitiesQuery({
    // This endpoint is not cached to prevent error after logout + organization switch
    // https://github.com/getlago/lago-front/pull/2233/files
    fetchPolicy: 'no-cache',
    nextFetchPolicy: 'no-cache',
  })

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

    const target = generatePath(BILLING_ENTITY_ROUTE, {
      billingEntityCode: defaultBillingEntity.code,
    })

    return navigate(organizationSlug ? `/${organizationSlug}${target}` : target, {
      replace: true,
    })
  }, [billingEntitiesData, navigate, organizationSlug])

  return <Spinner />
}

export default SettingsHomePage
