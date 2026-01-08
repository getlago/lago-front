import { Icon } from 'lago-design-system'
import { useRef } from 'react'
import { generatePath } from 'react-router-dom'

import {
  ActionItem,
  Button,
  ButtonLink,
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
import {
  MEMBERS_PAGE_ROLE_FILTER_KEY,
  RoleItem,
  rolesNameMapping,
  systemRoles,
} from '~/core/constants/roles'
import { MEMBERS_ROUTE, ROLE_CREATE_ROUTE, ROLE_DETAILS_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useRolesList } from '~/hooks/useRolesList'
import { PageHeader } from '~/styles'

import { DeleteRoleDialog, DeleteRoleDialogRef } from '../common/dialogs/DeleteRoleDialog'
import RoleTypeChip from '../common/RoleTypeChip'
import { useRoleActions } from '../hooks/useRoleActions'

const RolesList = () => {
  const { isPremium } = useCurrentUser()
  const { translate } = useInternationalization()
  const { roles, isLoadingRoles } = useRolesList()
  const { navigateToDuplicate, navigateToEdit } = useRoleActions()

  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const deleteRoleDialogRef = useRef<DeleteRoleDialogRef>(null)

  const openPremiumDialog = () => {
    premiumWarningDialogRef.current?.openDialog()
  }

  const openDeleteRoleDialog = (role: RoleItem) => {
    deleteRoleDialogRef.current?.openDialog(role)
  }

  const getRoleHeaderAction = () => {
    if (!isPremium) {
      return (
        <Button onClick={openPremiumDialog} variant="inline" endIcon="sparkles">
          {translate('text_1765530400261k7yl3n4kk8h')}
        </Button>
      )
    }

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

    return <Typography color="grey600">{nameToDisplay}</Typography>
  }

  const displayMemberNumberCell = (role: RoleItem) => {
    const membersNumber = role.memberships.length || 0

    const path = `${MEMBERS_ROUTE}?${MEMBERS_PAGE_ROLE_FILTER_KEY}=${role.name}`

    return (
      <ButtonLink type="button" to={path} buttonProps={{ variant: 'inline' }}>
        {membersNumber}
      </ButtonLink>
    )
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
    const canDelete = role.memberships.length === 0

    if (isSystemRole) {
      if (!isPremium) {
        return [
          {
            startIcon: 'duplicate',
            endIcon: 'sparkles',
            title: translate('text_64fa170e02f348164797a6af'),
            onAction: openPremiumDialog,
          },
        ]
      }

      return [
        {
          startIcon: 'duplicate',
          title: translate('text_64fa170e02f348164797a6af'),
          onAction: () => navigateToDuplicate(role.id),
        },
      ]
    }

    return [
      {
        startIcon: 'duplicate',
        title: translate('text_64fa170e02f348164797a6af'),
        onAction: () => navigateToDuplicate(role.id),
      },
      {
        startIcon: 'pen',
        title: translate('text_1765528921745ibx4b56q1mt'),
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
          {!isPremium && roles.length === 0 && (
            <div className="flex w-full flex-row items-center justify-between gap-2 rounded-xl bg-grey-100 px-6 py-4">
              <div className="flex flex-col">
                <div className="flex flex-row items-center gap-2">
                  <Typography variant="bodyHl" color="grey700">
                    {translate('text_1765450549863hmt6lo6scog')}
                  </Typography>
                  <Icon name="sparkles" />
                </div>

                <Typography variant="caption" color="grey600">
                  {translate('text_1732286530467gnhwm6q5ftl')}
                </Typography>
              </div>
              <Button endIcon="sparkles" variant="tertiary" onClick={openPremiumDialog}>
                {translate('text_65ae73ebe3a66bec2b91d72d')}
              </Button>
            </div>
          )}
        </SettingsListWrapper>
      </SettingsPaddedContainer>

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
      <DeleteRoleDialog ref={deleteRoleDialogRef} />
    </>
  )
}

export default RolesList
