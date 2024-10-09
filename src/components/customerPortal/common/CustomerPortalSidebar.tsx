import styled from 'styled-components'

import { Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Logo from '~/public/images/logo/lago-logo-grey.svg'
import { theme } from '~/styles'

const CustomerPortalSidebar = ({
  organizationName,
  organizationLogoUrl,
}: {
  organizationName?: string | null
  organizationLogoUrl?: string | null
}) => {
  const { translate } = useInternationalization()

  return (
    <>
      <div className="hidden h-screen w-96 flex-col gap-8 bg-grey-100 p-16 md:flex">
        <div className="flex items-center">
          {!!organizationLogoUrl && (
            <OrgaLogoContainer>
              <img src={organizationLogoUrl} alt={`${organizationName}'s logo`} />
            </OrgaLogoContainer>
          )}
          <Typography variant="headline">{organizationName}</Typography>
        </div>

        <h3 className="text-lg font-semibold text-black">Manage your plans & billing</h3>

        <div className="flex items-center">
          <InlinePoweredByTypography variant="note" color="grey500">
            {translate('text_6419c64eace749372fc72b03')}
          </InlinePoweredByTypography>
          <StyledLogo />
        </div>
      </div>

      <div className="flex h-24 w-full items-center justify-center bg-grey-100 md:hidden">
        <div className="flex items-center">
          {!!organizationLogoUrl && (
            <OrgaLogoContainer>
              <img src={organizationLogoUrl} alt={`${organizationName}'s logo`} />
            </OrgaLogoContainer>
          )}
          <Typography variant="headline">{organizationName}</Typography>
        </div>
      </div>
    </>
  )
}

const InlinePoweredByTypography = styled(Typography)`
  margin-right: ${theme.spacing(1)};
`

const StyledLogo = styled(Logo)`
  width: 40px;
`

const OrgaLogoContainer = styled.div`
  width: 32px;
  height: 32px;
  margin-right: ${theme.spacing(3)};
  border-radius: 8px;

  > img {
    height: 100%;
    width: 100%;
    object-fit: cover;
    border-radius: inherit;
  }
`

export default CustomerPortalSidebar
