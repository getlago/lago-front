import { ApolloError } from '@apollo/client'
import styled from 'styled-components'

import { LoaderSidebarOrganization } from '~/components/customerPortal/common/SectionLoading'
import { Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Logo from '~/public/images/logo/lago-logo-grey.svg'
import { theme } from '~/styles'

type CustomerPortalSidebarProps = {
  organizationName?: string | null
  organizationLogoUrl?: string | null
  isLoading?: boolean
  isError?: ApolloError
}

const CustomerPortalSidebar = ({
  organizationName,
  organizationLogoUrl,
  isLoading,
}: CustomerPortalSidebarProps) => {
  const { translate } = useInternationalization()

  return (
    <>
      <div className="hidden h-screen w-[400px] shrink-0 flex-col gap-8 bg-grey-100 p-16 md:flex">
        {(isLoading || !!organizationLogoUrl || organizationName) && (
          <div className="flex items-center">
            {isLoading && (
              <div className="w-full">
                <LoaderSidebarOrganization />
              </div>
            )}

            {!isLoading && !!organizationLogoUrl && (
              <OrgaLogoContainer>
                <img src={organizationLogoUrl} alt={`${organizationName}'s logo`} />
              </OrgaLogoContainer>
            )}

            {organizationName && <Typography variant="headline">{organizationName}</Typography>}
          </div>
        )}

        {!isLoading && (
          <h3 className="text-lg font-semibold text-black">Manage your plans & billing</h3>
        )}

        <div className="flex items-center gap-1">
          <span className="text-xs font-normal text-grey-600">
            {translate('text_6419c64eace749372fc72b03')}
          </span>

          <StyledLogo />
        </div>
      </div>

      <div className="mb-4 flex w-full items-center justify-center bg-grey-100 px-5 py-8 md:hidden">
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
