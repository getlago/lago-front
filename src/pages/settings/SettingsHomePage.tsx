import { useEffect } from 'react'
import { generatePath } from 'react-router-dom'

import { Spinner } from '~/components/designSystem/Spinner'
import { BILLING_ENTITY_ROUTE, SETTINGS_ROUTE, useLocation, useNavigate } from '~/core/router'
import { useGetBillingEntitiesQuery } from '~/generated/graphql'

const SettingsHomePage = () => {
  const navigate = useNavigate()
  const { strippedPathname } = useLocation()

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

    // react-router v7 wraps navigations in startTransition, so this page can stay mounted
    // (and this query can still resolve) after the user has already navigated elsewhere from
    // the settings nav. Bail out instead of clobbering that navigation with a stale redirect.
    if (strippedPathname !== SETTINGS_ROUTE) {
      return
    }

    const defaultBillingEntity = billingEntitiesData?.billingEntities?.collection?.find(
      (b) => b.isDefault,
    )

    if (!defaultBillingEntity?.code) {
      return
    }

    // The `~/core/router` wrapper auto-prepends the org slug, so we can pass
    // the absolute route constant directly.
    return navigate(
      generatePath(BILLING_ENTITY_ROUTE, {
        billingEntityCode: defaultBillingEntity.code,
      }),
      { replace: true },
    )
  }, [billingEntitiesData, navigate, strippedPathname])

  return <Spinner />
}

export default SettingsHomePage
