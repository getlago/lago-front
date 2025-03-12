import { RevenueStreamDataForOverviewSectionFragment } from '~/generated/graphql'

export const formatRevenueStreamsData = ({
  data,
}: {
  data: RevenueStreamDataForOverviewSectionFragment[] | undefined
  searchParams: URLSearchParams
}): RevenueStreamDataForOverviewSectionFragment[] => {
  if (!data?.length) {
    return []
  }

  return data
}
