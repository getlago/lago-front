import { Avatar, Table, TableColumn, Typography } from '~/components/designSystem'
import { SettingsListItemLoadingSkeleton } from '~/components/layouts/Settings'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { RoleItem } from '~/pages/settings/roles/common/roleTypes'

export type RoleDetailsPermissionsProps = {
  isLoading: boolean
  role: RoleItem | undefined
}

const MEMBERS_ROW_SIZE = 72

const RoleDetailsMembers = ({ isLoading, role }: RoleDetailsPermissionsProps) => {
  const { translate } = useInternationalization()

  if (isLoading) {
    return (
      <div className="pt-8">
        <SettingsListItemLoadingSkeleton />
      </div>
    )
  }

  const columns: Array<TableColumn<RoleItem['members'][number]>> = [
    {
      key: 'email',
      title: '',
      content: (member) => (
        <div className="flex flex-1 items-center gap-3">
          <Avatar variant="user" identifier={(member.email || '').charAt(0)} size="big" />
          <Typography variant="body" color="grey700">
            {member.email}
          </Typography>
        </div>
      ),
    },
  ]

  return (
    <div className="pt-8">
      <div className="flex flex-col gap-2">
        <Typography variant="headline">{translate('text_63208b630aaf8df6bbfb2655')}</Typography>
        <Typography color="grey600">{translate('text_17660641695938ntvs0023to')}</Typography>
      </div>
      <div className="mt-10">
        {role && (
          <Table
            containerSize={{ default: 0 }}
            name="role-members"
            data={role.members}
            columns={columns}
            rowSize={MEMBERS_ROW_SIZE}
            isHeaderDisplayed={false}
          />
        )}
      </div>
    </div>
  )
}

export default RoleDetailsMembers
