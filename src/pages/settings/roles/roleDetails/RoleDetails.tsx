import { generatePath, useParams } from 'react-router-dom'

import {
  Button,
  ButtonLink,
  NavigationTab,
  NavigationTabItem,
  Popper,
  Skeleton,
  Typography,
} from '~/components/designSystem'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import {
  ROLE_DETAILS_ROUTE,
  ROLE_DETAILS_TAB_ROUTE,
  ROLE_EDIT_ROUTE,
  ROLES_LIST_ROUTE,
} from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { MenuPopper, PageHeader } from '~/styles'

import RoleDetailsMembers from './roleDetailsMembers/RoleDetailsMembers'
import RoleDetailsPermissions from './roleDetailsPermissions/RoleDetailsPermissions'
import { useRoleDetails } from './useRoleDetails'

import { roleDetailsTabOptions } from '../common/rolesConst'
import { useRoleDisplayName } from '../common/useRoleDisplayName'

const RoleDetails = () => {
  const { translate } = useInternationalization()
  const { roleId } = useParams<string>()
  const { role, isLoadingRole, canBeEdited, canBeDeleted } = useRoleDetails({ roleId })
  const { getDisplayName } = useRoleDisplayName()

  if (!roleId) {
    return <div>Role ID is missing</div>
  }

  const displayName = getDisplayName(role)

  const tabs: Array<NavigationTabItem> = [
    {
      title: translate('text_634687079be251fdb43833b7'),
      link: generatePath(ROLE_DETAILS_TAB_ROUTE, {
        roleId,
        tab: roleDetailsTabOptions.overview,
      }),
      match: [
        generatePath(ROLE_DETAILS_TAB_ROUTE, {
          roleId,
          tab: roleDetailsTabOptions.overview,
        }),
        generatePath(ROLE_DETAILS_ROUTE, {
          roleId,
        }),
      ],
      component: (
        <DetailsPage.Container>
          <RoleDetailsPermissions isLoading={isLoadingRole} role={role} />
        </DetailsPage.Container>
      ),
    },
    {
      title: translate('text_63208b630aaf8df6bbfb2655'),
      link: generatePath(ROLE_DETAILS_TAB_ROUTE, {
        roleId: roleId,
        tab: roleDetailsTabOptions.members,
      }),
      component: (
        <DetailsPage.Container>
          <RoleDetailsMembers isLoading={isLoadingRole} role={role} />
        </DetailsPage.Container>
      ),
    },
  ]

  const handleDelete = () => {}

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
        <Popper
          PopperProps={{ placement: 'bottom-end' }}
          opener={
            <Button endIcon="chevron-down">{translate('text_634687079be251fdb438338f')}</Button>
          }
        >
          {() => (
            <MenuPopper>
              <ButtonLink
                to={generatePath(ROLE_EDIT_ROUTE, { roleId })}
                type="tab"
                icon="pen"
                disabled={!canBeEdited}
              >
                {translate('text_63aa15caab5b16980b21b0b8')}
              </ButtonLink>
              <Button
                startIcon="trash"
                variant="quaternary"
                disabled={!canBeDeleted}
                onClick={handleDelete}
              >
                {translate('text_6261640f28a49700f1290df5')}
              </Button>
            </MenuPopper>
          )}
        </Popper>
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
