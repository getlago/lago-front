import SectionTitle from '~/components/customerPortal/common/SectionTitle'
import { Skeleton } from '~/components/designSystem/Skeleton'

const group = (
  <div className="mb-12">
    <SectionTitle title="" loading={true} />

    <div className="grid grid-cols-2">
      <div className="flex flex-col gap-3">
        <Skeleton variant="text" width={72} />
        <Skeleton variant="text" width={160} />
      </div>

      <div className="flex flex-col gap-3">
        <Skeleton variant="text" width={72} />
        <Skeleton variant="text" width={160} />
      </div>
    </div>
  </div>
)

export const LoaderUsageSection = () => (
  <div className="grid grid-cols-2">
    <div className="flex flex-col gap-3">
      <Skeleton variant="text" width={72} />
      <Skeleton variant="text" width={160} />
      <Skeleton variant="text" width={240} />
      <Skeleton variant="text" width={72} />
    </div>

    <div className="flex flex-col gap-3">
      <Skeleton variant="text" width={72} />
      <Skeleton variant="text" width={160} />
      <Skeleton variant="text" width={240} />
      <Skeleton variant="text" width={72} />
    </div>
  </div>
)

export const LoaderUsageSubscriptionItem = () => (
  <div className="flex flex-col gap-3">
    <Skeleton variant="text" width={72} />
    <Skeleton variant="text" width={160} />
    <Skeleton variant="text" width={240} />
    <Skeleton variant="text" width={72} />
  </div>
)

export const LoaderWalletPage = () => (
  <div className="mt-8 flex flex-col gap-4">
    {group}
    {group}
    {group}
  </div>
)

export const LoaderWalletSection = () => (
  <div className="grid grid-cols-2">
    <div className="flex flex-col gap-3">
      <Skeleton variant="text" width={72} />
      <Skeleton variant="text" width={160} />
    </div>

    <div className="flex flex-col gap-3">
      <Skeleton variant="text" width={72} />
      <Skeleton variant="text" width={160} />
    </div>
  </div>
)

export const LoaderCustomerInformationSection = () => (
  <div className="grid grid-cols-2 gap-6">
    <div className="flex flex-col gap-3">
      <Skeleton variant="text" width={72} />
      <Skeleton variant="text" width={240} />
    </div>

    <div className="flex flex-col gap-3">
      <Skeleton variant="text" width={72} />
      <Skeleton variant="text" width={240} />
    </div>

    <div className="flex flex-col gap-3">
      <Skeleton variant="text" width={72} />
      <Skeleton variant="text" width={240} />
    </div>

    <div className="flex flex-col gap-3">
      <Skeleton variant="text" width={72} />
      <Skeleton variant="text" width={240} />
    </div>

    <div className="flex flex-col gap-3">
      <Skeleton variant="text" width={72} />
      <Skeleton variant="text" width={240} />
    </div>

    <div className="flex flex-col gap-3">
      <Skeleton variant="text" width={72} />
      <Skeleton variant="text" width={240} />
    </div>
  </div>
)

export const LoaderCustomerInformationPage = () => (
  <div className="mt-8 flex flex-col gap-4">
    {group}
    {group}
    {group}
  </div>
)

export const LoaderInvoicesListSection = () => (
  <div className="mt-8 flex flex-col gap-4">
    {group}
    {group}
    {group}
  </div>
)

export const LoaderInvoicesListTotal = () => (
  <div className="flex flex-col gap-3">
    <Skeleton variant="text" width={72} />
    <Skeleton variant="text" width={240} />
  </div>
)

export const LoaderSidebarOrganization = () => (
  <div className="flex flex-col gap-8">
    <Skeleton className="!rounded-[8px] bg-grey-200" variant="text" width={32} />
    <Skeleton className="bg-grey-200" variant="text" width={228} />
  </div>
)

export const SectionLoading = () => {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton variant="text" width={120} />
      <Skeleton variant="text" width={160} />
      <Skeleton variant="text" width={200} />
    </div>
  )
}

export default SectionLoading
