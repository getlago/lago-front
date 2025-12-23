import { Icon } from 'lago-design-system'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import {
  ActionItem,
  Button,
  ButtonLink,
  Status,
  StatusType,
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
import { ROLE_CREATE_ROUTE, ROLE_DETAILS_ROUTE, ROLE_EDIT_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { PageHeader } from '~/styles'

import { useRolesList } from './useRolesList'

import { rolesNameMapping, systemRoles } from '../common/rolesConst'
import { RoleItem } from '../common/roleTypes'

const RolesList = () => {
  const { isPremium } = useCurrentUser()
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { roles, isLoadingRoles, deleteRole } = useRolesList()

  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)

  const openPremiumDialog = () => {
    premiumWarningDialogRef.current?.openDialog()
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
    const membersNumber = role.members.length || 0

    return (
      <Typography variant="captionHl" color="grey700">
        {membersNumber}
      </Typography>
    )
  }

  const displayRoleTypeCell = (role: RoleItem) => {
    const roleType = systemRoles.includes(role.name)
      ? translate('text_1765464506554l3g5v7dctfv')
      : translate('text_6641dd21c0cffd005b5e2a8b')

    return <Status label={roleType} type={StatusType.default} />
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
      key: 'admin',
      title: translate('text_17654644170188lrzkfyhtkf'),
      content: displayRoleTypeCell,
    },
  ]

  const actionColumnTooltip = () => translate('text_1765528202844ro1c3jxwbs8')

  const actionColumn = (role: RoleItem): Array<ActionItem<RoleItem>> => {
    const isSystemRole = systemRoles.includes(role.name)
    const canEdit = !isSystemRole
    const canDelete = !isSystemRole && role.members.length === 0

    return [
      {
        startIcon: 'duplicate',
        title: translate('text_64fa170e02f348164797a6af'),
        onAction: async () => {
          const path = generatePath(ROLE_CREATE_ROUTE)
          const query = `?duplicate-from=${role.id}`

          navigate(`${path}${query}`)
        },
      },
      {
        startIcon: 'pen',
        title: translate('text_1765528921745ibx4b56q1mt'),
        disabled: !canEdit,
        onAction: async () => {
          navigate(generatePath(ROLE_EDIT_ROUTE, { roleId: role.id }))
        },
      },
      {
        startIcon: 'trash',
        title: translate('text_6261640f28a49700f1290df5'),
        disabled: !canDelete,
        onAction: async () => {
          deleteRole(role.id)
          // Launch duplicate role logic here then navigate to it
        },
      },
    ]
  }

  const handleRowclick = (role: RoleItem) => {
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
                onRowActionLink={handleRowclick}
              />
            </SettingsListItem>
          )}
          {!isPremium && (
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
    </>
  )
}

export default RolesList
