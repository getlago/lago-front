import { Skeleton } from '~/components/designSystem/Skeleton'

type SectionLoadingProps = {
  variant?: 'customer-information-page' | 'usage-subscription-item' | 'wallet-section'
}

const SectionLoading = ({ variant }: SectionLoadingProps) => {
  if (variant === 'wallet-section') {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton variant="text" height={12} width={120} />
        <Skeleton variant="text" height={12} width={160} />
        <Skeleton variant="text" height={12} width={200} />
      </div>
    )
  }

  if (variant === 'usage-subscription-item') {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton variant="text" height={12} width={120} />
        <Skeleton variant="text" height={12} width={160} />
        <Skeleton variant="text" height={12} width={200} />
      </div>
    )
  }

  if (variant === 'customer-information-page') {
    return (
      <div className="mt-8 flex flex-col gap-2">
        <Skeleton variant="text" height={12} width={120} />
        <Skeleton variant="text" height={12} width={160} />
        <Skeleton variant="text" height={12} width={200} />
        <Skeleton variant="text" height={12} width={120} />
        <Skeleton variant="text" height={12} width={160} />
        <Skeleton variant="text" height={12} width={200} />
        <div className="grid grid-cols-2">
          <div className="flex flex-col gap-2">
            <Skeleton variant="text" height={12} width={120} />
            <Skeleton variant="text" height={12} width={160} />
            <Skeleton variant="text" height={12} width={200} />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton variant="text" height={12} width={120} />
            <Skeleton variant="text" height={12} width={160} />
            <Skeleton variant="text" height={12} width={200} />
          </div>
        </div>
        <Skeleton variant="text" height={12} width={120} />
        <Skeleton variant="text" height={12} width={160} />
        <Skeleton variant="text" height={12} width={200} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Skeleton variant="text" height={12} width={120} />
      <Skeleton variant="text" height={12} width={160} />
      <Skeleton variant="text" height={12} width={200} />
    </div>
  )
}

export default SectionLoading
