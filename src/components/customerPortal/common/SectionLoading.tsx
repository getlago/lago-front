import { Skeleton } from '~/components/designSystem/Skeleton'

const SectionLoading = () => (
  <div className="flex items-center">
    <Skeleton variant="text" height={12} width={120} />
    <Skeleton variant="text" height={12} width={120} />
    <Skeleton variant="text" height={12} width={120} />
  </div>
)

export default SectionLoading
