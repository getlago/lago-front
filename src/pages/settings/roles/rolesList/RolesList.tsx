import { useRef } from 'react'
import { generatePath } from 'react-router-dom'

import {
  ActionItem,
  Button,
  ButtonLink,
  PremiumBanner,
  Table,
  TableColumn,
  Typography,
} from '~/components/designSystem'
import {
  SettingsListItem,
  SettingsListItemHeader,
  SettingsListItemLoadingSkeleton,
  SettingsListWrapper,
  SettingsPaddedContainer,
  SettingsPageHeaderContainer,
} from '~/components/layouts/Settings'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { RoleItem, rolesNameMapping, systemRoles } from '~/core/constants/roles'
import { ROLE_CREATE_ROUTE, ROLE_DETAILS_ROUTE } from '~/core/router'
import { PremiumIntegrationTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import { useRolesList } from '~/hooks/useRolesList'
import { PageHeader } from '~/styles'

import { DeleteRoleDialog, DeleteRoleDialogRef } from '../common/dialogs/DeleteRoleDialog'
import RoleTypeChip from '../common/RoleTypeChip'
import { useRoleActions } from '../hooks/useRoleActions'

const RolesList = () => {
  const { hasOrganizationPremiumAddon } = useOrganizationInfos()
  const hasPremiumAddon = hasOrganizationPremiumAddon(PremiumIntegrationTypeEnum.CustomRoles)

  const { translate } = useInternationalization()
  const { roles, isLoadingRoles } = useRolesList()
  const { navigateToDuplicate, navigateToEdit } = useRoleActions()
  const { hasPermissions } = usePermissions()

  const canCreateRoles = hasPermissions(['rolesCreate'])
  const canEditRoles = hasPermissions(['rolesUpdate'])
  const canDeleteRoles = hasPermissions(['rolesDelete'])

  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const deleteRoleDialogRef = useRef<DeleteRoleDialogRef>(null)

  const openPremiumDialog = () => {
    premiumWarningDialogRef.current?.openDialog()
  }

  const openDeleteRoleDialog = (role: RoleItem) => {
    deleteRoleDialogRef.current?.openDialog(role)
  }

  const getRoleHeaderAction = () => {
    if (!hasPremiumAddon) {
      return (
        <Button onClick={openPremiumDialog} variant="inline" endIcon="sparkles">
          {translate('text_1765530400261k7yl3n4kk8h')}
        </Button>
      )
    }

    if (!canCreateRoles) return

    return (
      <ButtonLink type="button" to={ROLE_CREATE_ROUTE} buttonProps={{ variant: 'inline' }}>
        {translate('text_1765530400261k7yl3n4kk8h')}
      </ButtonLink>
    )
  }

  const displayNameCell = (role: RoleItem) => {
    const nameToDisplay = systemRoles.includes(role.name)
      ? translate(rolesNameMapping[role.name as keyof typeof rolesNameMapping])
      : role.name

    return <Typography color="grey700">{nameToDisplay}</Typography>
  }

  const displayMemberNumberCell = (role: RoleItem) => {
    const membersNumber = role.memberships.length || 0

    return <Typography color="grey600">{membersNumber}</Typography>
  }

  const displayRoleTypeCell = (role: RoleItem) => {
    return <RoleTypeChip role={role} />
  }

  const columns: Array<TableColumn<RoleItem>> = [
    {
      key: 'name',
      title: translate('text_1765464417018tezju4yvyoo'),
      content: displayNameCell,
      maxSpace: true,
    },
    {
      key: 'id',
      title: translate('text_1765464417018n3moulidii0'),
      content: displayMemberNumberCell,
      textAlign: 'right',
    },
    {
      key: 'description',
      title: translate('text_17654644170188lrzkfyhtkf'),
      content: displayRoleTypeCell,
    },
  ]

  const actionColumnTooltip = () => translate('text_1765528202844ro1c3jxwbs8')

  const actionColumn = (role: RoleItem): Array<ActionItem<RoleItem>> => {
    const isSystemRole = systemRoles.includes(role.name)
    const canDelete = role.memberships.length === 0 && canDeleteRoles

    if (!hasPremiumAddon) {
      return [
        {
          startIcon: 'duplicate',
          endIcon: 'sparkles',
          title: translate('text_64fa170e02f348164797a6af'),
          onAction: openPremiumDialog,
        },
      ]
    }

    if (isSystemRole) {
      return [
        {
          startIcon: 'duplicate',
          title: translate('text_64fa170e02f348164797a6af'),
          disabled: !canCreateRoles,
          onAction: () => navigateToDuplicate(role.id),
        },
      ]
    }

    return [
      {
        startIcon: 'duplicate',
        title: translate('text_64fa170e02f348164797a6af'),
        disabled: !canCreateRoles,
        onAction: () => navigateToDuplicate(role.id),
      },
      {
        startIcon: 'pen',
        title: translate('text_1765528921745ibx4b56q1mt'),
        disabled: !canEditRoles,
        onAction: () => navigateToEdit(role.id),
      },
      {
        startIcon: 'trash',
        title: translate('text_6261640f28a49700f1290df5'),
        disabled: !canDelete,
        tooltip: translate('text_1767002012431la8gv2iqucp'),
        tooltipListener: canDelete,
        tooltipPlacement: 'left',
        onAction: () => openDeleteRoleDialog(role),
      },
    ]
  }

  const handleRowClick = (role: RoleItem) => {
    return generatePath(ROLE_DETAILS_ROUTE, {
      roleId: role.id,
    })
  }

  return (
    <>
      <PageHeader.Wrapper>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_1765448879791epmkg4xijkn')}
        </Typography>
      </PageHeader.Wrapper>

      <SettingsPaddedContainer>
        <SettingsPageHeaderContainer>
          <Typography variant="headline">{translate('text_1765448879791epmkg4xijkn')}</Typography>
          <Typography>{translate('text_1765449274238uzkq6xxdcev')}</Typography>
        </SettingsPageHeaderContainer>

        <SettingsListWrapper>
          {isLoadingRoles && <SettingsListItemLoadingSkeleton />}
          {!isLoadingRoles && (
            <SettingsListItem className="[box-shadow:none]">
              <SettingsListItemHeader
                label={translate('text_1765448879791epmkg4xijkn')}
                sublabel={translate('text_1765530135524j574y0dr6bb')}
                action={getRoleHeaderAction()}
              />
              <Table
                name="roles"
                containerSize={{ default: 0 }}
                data={roles}
                columns={columns}
                isLoading={isLoadingRoles}
                actionColumnTooltip={actionColumnTooltip}
                actionColumn={actionColumn}
                onRowActionLink={handleRowClick}
              />
            </SettingsListItem>
          )}
          {!hasPremiumAddon && roles.length === 0 && (
            <PremiumBanner
              variant="grey"
              title={translate('text_1765450549863hmt6lo6scog')}
              description={translate('text_1732286530467gnhwm6q5ftl')}
              premiumWarningDialogRef={premiumWarningDialogRef}
              className="w-full rounded-xl px-6 py-4"
            />
          )}
        </SettingsListWrapper>
      </SettingsPaddedContainer>

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
      <DeleteRoleDialog ref={deleteRoleDialogRef} />
    </>
  )
}

export default RolesList
