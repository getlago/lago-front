import { Icon } from 'lago-design-system'
import { useRef } from 'react'
import { useParams } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import { ButtonLink } from '~/components/designSystem/ButtonLink'
import { Popper } from '~/components/designSystem/Popper'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { usePremiumWarningDialog } from '~/components/dialogs/PremiumWarningDialog'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { SettingsListItemLoadingSkeleton } from '~/components/layouts/Settings'
import { MEMBERS_PAGE_ROLE_FILTER_KEY } from '~/core/constants/roles'
import { MEMBERS_ROUTE, ROLES_LIST_ROUTE } from '~/core/router'
import { PremiumIntegrationTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { useRoleDisplayInformation } from '~/hooks/useRoleDisplayInformation'
import { MenuPopper, PageHeader } from '~/styles'

import { DeleteRoleDialog, DeleteRoleDialogRef } from '../common/dialogs/DeleteRoleDialog'
import { mapPermissionsFromRole } from '../common/rolePermissionsForm/mappers/mapPermissionsFromRole'
import RolePermissionsForm from '../common/rolePermissionsForm/RolePermissionsForm'
import RoleTypeChip from '../common/RoleTypeChip'
import { useRoleActions } from '../hooks/useRoleActions'
import { useRoleDetails } from '../hooks/useRoleDetails'

const RoleDetails = () => {
  const { translate } = useInternationalization()
  const { roleId } = useParams<string>()
  const { role, isLoadingRole, isSystem, canBeDuplicated, canBeEdited, canBeDeleted } =
    useRoleDetails({ roleId })
  const { getDisplayName, getDisplayDescription } = useRoleDisplayInformation()
  const { navigateToDuplicate, navigateToEdit } = useRoleActions()
  const { hasOrganizationPremiumAddon } = useOrganizationInfos()
  const hasPremiumAddon = hasOrganizationPremiumAddon(PremiumIntegrationTypeEnum.CustomRoles)

  const premiumWarningDialog = usePremiumWarningDialog()
  const deleteRoleDialogRef = useRef<DeleteRoleDialogRef>(null)

  const openPremiumDialog = () => {
    premiumWarningDialog.open()
  }

  const openDeleteRoleDialog = () => {
    if (!role) return
    deleteRoleDialogRef.current?.openDialog(role)
  }

  const form = useAppForm({
    defaultValues: {
      permissions: mapPermissionsFromRole(role),
    },
  })

  if (!roleId) {
    return <div>Role ID is missing</div>
  }

  const displayName = getDisplayName(role)
  const displayDescription = getDisplayDescription(role)
  const getMembersListPath = () => `${MEMBERS_ROUTE}?${MEMBERS_PAGE_ROLE_FILTER_KEY}=${role?.name}`

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
              {!hasPremiumAddon && (
                <Button
                  startIcon="duplicate"
                  variant="quaternary"
                  endIcon="sparkles"
                  align="left"
                  fullWidth
                  onClick={openPremiumDialog}
                >
                  {translate('text_64fa170e02f348164797a6af')}
                </Button>
              )}
              {hasPremiumAddon && (
                <Button
                  startIcon="duplicate"
                  variant="quaternary"
                  align="left"
                  fullWidth
                  disabled={!canBeDuplicated}
                  onClick={() => navigateToDuplicate(roleId)}
                >
                  {translate('text_64fa170e02f348164797a6af')}
                </Button>
              )}
              {!isSystem && hasPremiumAddon && (
                <Button
                  startIcon="pen"
                  variant="quaternary"
                  fullWidth
                  align="left"
                  disabled={!canBeEdited}
                  onClick={() => navigateToEdit(roleId)}
                >
                  {translate('text_63aa15caab5b16980b21b0b8')}
                </Button>
              )}
              {!isSystem && hasPremiumAddon && (
                <Tooltip
                  title={translate('text_1767002012431la8gv2iqucp')}
                  disableHoverListener={canBeDeleted}
                  placement="left"
                >
                  <Button
                    startIcon="trash"
                    variant="quaternary"
                    fullWidth
                    align="left"
                    disabled={!canBeDeleted}
                    onClick={openDeleteRoleDialog}
                  >
                    {translate('text_6261640f28a49700f1290df5')}
                  </Button>
                </Tooltip>
              )}
            </MenuPopper>
          )}
        </Popper>
      </PageHeader.Wrapper>
      <DetailsPage.Header
        isLoading={isLoadingRole}
        icon="user"
        title={displayName}
        description={role?.code || ''}
      />
      <DetailsPage.Container>
        <div className="flex flex-col gap-8">
          {isLoadingRole && <SettingsListItemLoadingSkeleton count={2} />}

          {!isLoadingRole && (
            <>
              <div className="flex flex-col gap-6">
                <Typography variant="subhead1">
                  {translate('text_1767012423699qiisp5z4jqy')}
                </Typography>
                <div className="flex flex-col gap-4">
                  <div>
                    <Typography variant="caption">
                      {translate('text_6388b923e514213fed58331c')}
                    </Typography>
                    <Typography color="grey700">{displayDescription}</Typography>
                  </div>
                  <div className="flex flex-row gap-8">
                    <div className="flex flex-1 flex-col">
                      <Typography variant="caption">
                        {translate('text_17654644170188lrzkfyhtkf')}
                      </Typography>
                      <RoleTypeChip role={role} />
                    </div>
                    <div className="flex flex-1 flex-col">
                      <Typography variant="caption">
                        {translate('text_1765464417018n3moulidii0')}
                      </Typography>
                      <ButtonLink
                        type="button"
                        to={getMembersListPath()}
                        external
                        buttonProps={{ variant: 'inline' }}
                      >
                        <div className="flex flex-row items-center gap-2">
                          {role?.memberships.length || 0}
                          <Icon name="outside" />
                        </div>
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              </div>
              <RolePermissionsForm
                form={form}
                fields="permissions"
                isEditable={false}
                isLoading={isLoadingRole}
              />
            </>
          )}
        </div>
      </DetailsPage.Container>
      <DeleteRoleDialog ref={deleteRoleDialogRef} />
    </>
  )
}

export default RoleDetails
