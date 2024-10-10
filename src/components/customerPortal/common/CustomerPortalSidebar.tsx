import { ApolloError } from '@apollo/client'

import { LoaderSidebarOrganization } from '~/components/customerPortal/common/SectionLoading'
import { Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Logo from '~/public/images/logo/lago-logo-grey.svg'

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
              <div className="mr-3 size-8">
                <img
                  className="size-full rounded-lg object-cover"
                  src={organizationLogoUrl}
                  alt={`${organizationName}'s logo`}
                />
              </div>
            )}

            {organizationName && <Typography variant="headline">{organizationName}</Typography>}
          </div>
        )}

        {!isLoading && (
          <Typography className="text-lg font-semibold text-black">
            Manage your plans & billing
          </Typography>
        )}

        <div className="flex items-center gap-1">
          <Typography className="text-xs font-normal text-grey-600">
            {translate('text_6419c64eace749372fc72b03')}
          </Typography>

          <Logo width="40px" />
        </div>
      </div>

      <div className="mb-4 flex w-full items-center justify-center bg-grey-100 px-5 py-8 md:hidden">
        <div className="flex items-center">
          {!!organizationLogoUrl && (
            <div className="mr-4 size-8">
              <img
                className="size-full rounded-lg object-cover"
                src={organizationLogoUrl}
                alt={`${organizationName}'s logo`}
              />
            </div>
          )}
          <Typography variant="headline">{organizationName}</Typography>
        </div>
      </div>
    </>
  )
}

export default CustomerPortalSidebar
