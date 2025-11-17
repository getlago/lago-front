import { embedDashboard } from '@superset-ui/embedded-sdk'
import { Typography } from 'lago-design-system'
import { useEffect } from 'react'

import { useInternationalization } from '~/hooks/core/useInternationalization'
import '~/main.css'
import { PageHeader } from '~/styles'

const DASHBOARD_ID = ''
const MOCK_GUEST_TOKEN = ''

const fetchToken = async () => {
  return MOCK_GUEST_TOKEN
}

const Dashboards = () => {
  const { translate } = useInternationalization()

  useEffect(() => {
    const getToken = async () => {
      const mountPoint = document.getElementById('superset')

      if (!mountPoint) {
        return
      }

      embedDashboard({
        id: DASHBOARD_ID,
        supersetDomain: 'http://localhost:8089',
        mountPoint,
        fetchGuestToken: fetchToken,
        dashboardUiConfig: {
          hideTitle: true,
          filters: {
            expanded: true,
          },
          urlParams: {
            foo: 'value1',
            bar: 'value2',
          },
        },
        iframeSandboxExtras: ['allow-top-navigation', 'allow-popups-to-escape-sandbox'],
      })
    }

    getToken()
  }, [])

  return (
    <>
      <PageHeader.Wrapper withSide>
        <Typography variant="bodyHl" color="grey700" noWrap>
          {translate('text_1762346890583hgqcnuvj2rh')}
        </Typography>
      </PageHeader.Wrapper>

      <div className="height-minus-nav relative w-full">
        <div id="superset" className="absolute inset-0 size-full"></div>
      </div>
    </>
  )
}

export default Dashboards
