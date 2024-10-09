import SectionTitle from '~/components/customerPortal/common/SectionTitle'
import { Skeleton } from '~/components/designSystem/Skeleton'

type SectionLoadingProps = {
  variant?:
    | 'customer-information-page'
    | 'customer-information-section'
    | 'wallet-page'
    | 'wallet-section'
    | 'usage-section'
    | 'usage-subscription-item'
    | 'invoices-list-total'
}

const group = (
  <div className="mb-12">
    <SectionTitle title="" loading={true} />

    <div className="grid grid-cols-2">
      <div className="flex flex-col gap-3">
        <Skeleton variant="text" height={12} width={72} />
        <Skeleton variant="text" height={12} width={160} />
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton variant="text" height={12} width={72} />
        <Skeleton variant="text" height={12} width={160} />
      </div>
    </div>
  </div>
)

const SectionLoading = ({ variant }: SectionLoadingProps) => {
  if (variant === 'usage-section') {
    return (
      <div className="grid grid-cols-2">
        <div className="flex flex-col gap-3">
          <Skeleton variant="text" height={12} width={72} />
          <Skeleton variant="text" height={12} width={160} />
          <Skeleton variant="text" height={12} width={240} />
          <Skeleton variant="text" height={12} width={72} />
        </div>

        <div className="flex flex-col gap-3">
          <Skeleton variant="text" height={12} width={72} />
          <Skeleton variant="text" height={12} width={160} />
          <Skeleton variant="text" height={12} width={240} />
          <Skeleton variant="text" height={12} width={72} />
        </div>
      </div>
    )
  }

  if (variant === 'usage-subscription-item') {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton variant="text" height={12} width={72} />
        <Skeleton variant="text" height={12} width={160} />
        <Skeleton variant="text" height={12} width={240} />
        <Skeleton variant="text" height={12} width={72} />
      </div>
    )
  }

  if (variant === 'wallet-page') {
    return (
      <div className="mt-8 flex flex-col gap-4">
        {group}
        {group}
        {group}
      </div>
    )
  }

  if (variant === 'wallet-section') {
    return (
      <div className="grid grid-cols-2">
        <div className="flex flex-col gap-3">
          <Skeleton variant="text" height={12} width={72} />
          <Skeleton variant="text" height={12} width={160} />
        </div>

        <div className="flex flex-col gap-3">
          <Skeleton variant="text" height={12} width={72} />
          <Skeleton variant="text" height={12} width={160} />
        </div>
      </div>
    )
  }

  if (variant === 'customer-information-section') {
    return (
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-3">
          <Skeleton variant="text" height={12} width={72} />
          <Skeleton variant="text" height={12} width={240} />
        </div>

        <div className="flex flex-col gap-3">
          <Skeleton variant="text" height={12} width={72} />
          <Skeleton variant="text" height={12} width={240} />
        </div>

        <div className="flex flex-col gap-3">
          <Skeleton variant="text" height={12} width={72} />
          <Skeleton variant="text" height={12} width={240} />
        </div>

        <div className="flex flex-col gap-3">
          <Skeleton variant="text" height={12} width={72} />
          <Skeleton variant="text" height={12} width={240} />
        </div>

        <div className="flex flex-col gap-3">
          <Skeleton variant="text" height={12} width={72} />
          <Skeleton variant="text" height={12} width={240} />
        </div>

        <div className="flex flex-col gap-3">
          <Skeleton variant="text" height={12} width={72} />
          <Skeleton variant="text" height={12} width={240} />
        </div>
      </div>
    )
  }

  if (variant === 'customer-information-page') {
    return (
      <div className="mt-8 flex flex-col gap-4">
        {group}
        {group}
        {group}
      </div>
    )
  }

  if (variant === 'invoices-list-total') {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton variant="text" height={12} width={72} />
        <Skeleton variant="text" height={12} width={240} />
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
