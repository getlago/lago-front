import { Skeleton } from '~/components/designSystem/Skeleton'

const CustomerPortalLoading = () => (
  <div className="flex items-center">
    <Skeleton variant="text" height={12} width={120} />
    <Skeleton className="mr-3" variant="connectorAvatar" size="big" />
  </div>
)

export default CustomerPortalLoading
