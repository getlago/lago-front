import { gql } from '@apollo/client'
import { embedDashboard, EmbeddedDashboard } from '@superset-ui/embedded-sdk'
import { useEffect, useMemo, useRef } from 'react'

import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { Typography } from '~/components/designSystem/Typography'
import { envGlobalVar } from '~/core/apolloClient'
import { useSupersetDashboardsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import '~/main.css'
import ErrorImage from '~/public/images/maneki/error.svg'
import { PageHeader } from '~/styles'

const { lagoSupersetUrl } = envGlobalVar()

gql`
  query supersetDashboards {
    supersetDashboards {
      id
      embeddedId
      dashboardTitle
      guestToken
    }
  }
`

const Dashboards = () => {
  const { translate } = useInternationalization()

  const dashboardRef = useRef<string>('')

  const { data, error, loading } = useSupersetDashboardsQuery({})

  const dashboard = useMemo(() => {
    return data?.supersetDashboards?.find((d) => d.id === '1')
  }, [data?.supersetDashboards])

  useEffect(() => {
    if (!dashboard || dashboard?.id === dashboardRef?.current) {
      return
    }

    let embedded: null | EmbeddedDashboard = null

    const mount = async () => {
      const mountPoint = document.getElementById('superset')

      if (!mountPoint) {
        return
      }

      embedded = await embedDashboard({
        id: dashboard.embeddedId,
        supersetDomain: lagoSupersetUrl,
        mountPoint,
        fetchGuestToken: async () => dashboard?.guestToken,
        dashboardUiConfig: {
          hideTitle: true,
          filters: {
            expanded: true,
          },
        },
        iframeSandboxExtras: ['allow-top-navigation', 'allow-popups-to-escape-sandbox'],
      })

      dashboardRef.current = dashboard.id
    }

    mount()

    return () => {
      embedded?.unmount()
      dashboardRef.current = ''
    }
  }, [dashboard])

  return (
    <>
      <PageHeader.Wrapper withSide>
        <Typography variant="bodyHl" color="grey700" noWrap>
          {translate('text_6553885df387fd0097fd7384')}
        </Typography>
      </PageHeader.Wrapper>

      <div className="height-minus-nav relative w-full">
        {error && !loading && (
          <GenericPlaceholder
            title={translate('text_629728388c4d2300e2d380d5')}
            subtitle={translate('text_629728388c4d2300e2d380eb')}
            buttonTitle={translate('text_629728388c4d2300e2d38110')}
            buttonVariant="primary"
            buttonAction={() => location.reload()}
            image={<ErrorImage width="136" height="104" />}
          />
        )}

        <div id="superset" className="absolute inset-0 size-full"></div>
      </div>
    </>
  )
}

export default Dashboards
