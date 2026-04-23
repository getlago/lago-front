import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import { useIsAdminAuthenticated } from '~/hooks/auth/useIsAdminAuthenticated'

const AdminUsers = () => {
  const { adminEmail, adminRole, canWrite } = useIsAdminAuthenticated()

  return (
    <div className="p-12">
      <Typography variant="headline" className="mb-8">
        Users
      </Typography>

      <div className="rounded-xl border border-grey-300 bg-white p-8">
        <Typography variant="subhead1" className="mb-6">
          Current User
        </Typography>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Typography variant="captionHl" color="grey600">
              Email
            </Typography>
            <Typography>{adminEmail || '—'}</Typography>
          </div>
          <div className="flex items-center gap-3">
            <Typography variant="captionHl" color="grey600">
              Role
            </Typography>
            <Chip label={adminRole?.toUpperCase() || '—'} size="small" />
          </div>
          <div className="flex items-center gap-3">
            <Typography variant="captionHl" color="grey600">
              Permissions
            </Typography>
            <Typography>{canWrite ? 'Read & Write' : 'Read only'}</Typography>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminUsers
