import { generatePath, useParams } from 'react-router-dom'

import {
  ButtonLink,
  NavigationTab,
  NavigationTabItem,
  Skeleton,
  Typography,
} from '~/components/designSystem'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { ROLE_DETAILS_ROUTE, ROLES_LIST_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { PageHeader } from '~/styles'

import RoleDetailsPermissions from './roleDetailsPermissions/RoleDetailsPermissions'
import { useRoleDetails } from './useRoleDetails'

import { roleDetailsTabOptions } from '../common/rolesConst'
import { useRoleDisplayName } from '../common/useRoleDisplayName'

const RoleDetails = () => {
  const { translate } = useInternationalization()
  const { roleId } = useParams<string>()
  const { role, isLoadingRole } = useRoleDetails({ roleId })
  const { getDisplayName } = useRoleDisplayName()

  if (!roleId) {
    return <div>Role ID is missing</div>
  }

  const displayName = getDisplayName(role)

  const tabs: Array<NavigationTabItem> = [
    {
      title: translate('text_634687079be251fdb43833b7'),
      link: generatePath(ROLE_DETAILS_ROUTE, {
        roleId: roleId,
        tab: roleDetailsTabOptions.overview,
      }),
      component: (
        <DetailsPage.Container>
          <RoleDetailsPermissions isLoading={isLoadingRole} role={role} />
        </DetailsPage.Container>
      ),
    },
    {
      title: translate('text_63208b630aaf8df6bbfb2655'),
      link: generatePath(ROLE_DETAILS_ROUTE, {
        roleId: roleId,
        tab: roleDetailsTabOptions.members,
      }),
      component: (
        <DetailsPage.Container>
          <div>Members Content</div>
        </DetailsPage.Container>
      ),
    },
  ]

  return (
    <>
      <PageHeader.Wrapper>
        <PageHeader.Group>
          <ButtonLink
            to={ROLES_LIST_ROUTE}
            type="button"
            buttonProps={{ variant: 'quaternary', icon: 'arrow-left' }}
          />
          {isLoadingRole && <Skeleton variant="text" className="w-30" />}
          {!isLoadingRole && role && (
            <Typography variant="bodyHl" color="textSecondary">
              {displayName}
            </Typography>
          )}
        </PageHeader.Group>
      </PageHeader.Wrapper>
      <DetailsPage.Header
        isLoading={isLoadingRole}
        icon="user"
        title={displayName}
        description={role?.description || ''}
      />
      <NavigationTab className="px-4 md:px-12" loading={isLoadingRole} tabs={tabs} />
    </>
  )
}

export default RoleDetails
