import { Typography } from '~/components/designSystem/Typography'
import { ComboBox } from '~/components/form'
import { envGlobalVar } from '~/core/apolloClient'
import { LOGIN_ROUTE, SIGN_UP_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Card, Page, StyledLogo, Title } from '~/styles/auth'

import { SELF_SERVE_SIGNUP_DATA_REGION_TEST_ID } from './signUpTestIds'

const toOrigin = (url: string): string | undefined => {
  try {
    const { protocol, origin } = new URL(url)

    return protocol === 'http:' || protocol === 'https:' ? origin : undefined
  } catch {
    return undefined
  }
}

const SelfServeSignUp = (): JSX.Element => {
  const { translate } = useInternationalization()
  const { usFrontUrl, euFrontUrl } = envGlobalVar()

  const usOrigin = toOrigin(usFrontUrl)
  const euOrigin = toOrigin(euFrontUrl)
  const currentRegion = euOrigin === window.location.origin ? 'eu' : 'us'

  const onRegionChange = (region: string): void => {
    if (region === currentRegion) return

    window.location.assign(`${region === 'eu' ? euOrigin : usOrigin}${SIGN_UP_ROUTE}`)
  }

  return (
    <Page>
      <Card>
        <StyledLogo height={24} />

        <div className="flex flex-col gap-8">
          <div>
            <Title>{translate('text_17938957879289meoplynt8w')}</Title>
            <Typography html={translate('text_1793895787929sip26kglyfp')} />
          </div>

          {!!usOrigin && !!euOrigin && (
            <ComboBox
              name="dataRegion"
              label={translate('text_1793895787929v97fwznv57v')}
              helperText={translate('text_1793895787929wmv3w9xecm9')}
              data={[
                { value: 'us', label: translate('text_1793895787929iv5tx54sh92') },
                { value: 'eu', label: translate('text_1793895787929a6fnl607ebf') },
              ]}
              value={currentRegion}
              onChange={onRegionChange}
              disableClearable
              data-test={SELF_SERVE_SIGNUP_DATA_REGION_TEST_ID}
            />
          )}

          <Typography
            className="text-center"
            variant="caption"
            html={translate('text_1793895787929z6qmg4nhys2', { link: LOGIN_ROUTE })}
          />
        </div>
      </Card>
    </Page>
  )
}

export default SelfServeSignUp
