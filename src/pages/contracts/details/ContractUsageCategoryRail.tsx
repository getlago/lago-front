import { useSearchParams } from 'react-router'

import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { VerticalMenu } from '~/components/designSystem/VerticalMenu'
import { CONTRACT_USAGE_LIST_FILTER_PREFIX } from '~/core/constants/filters'
import { useLocation } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'

import { ContractUsageCategory } from './useContractUsageCategories'

type ContractUsageCategoryRailProps = {
  categories: ContractUsageCategory[]
  showStandalone: boolean
  activeCategoryId: string | null | undefined
  isLoading: boolean
  hasError: boolean
  onRetry: () => void
}

export const ContractUsageCategoryRail = ({
  categories,
  showStandalone,
  activeCategoryId,
  isLoading,
  hasError,
  onRetry,
}: ContractUsageCategoryRailProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { strippedPathname } = useLocation()
  const [searchParams] = useSearchParams()

  const buildLink = (categoryId: string | undefined): string => {
    const next = new URLSearchParams(searchParams)

    next.delete('page')
    Array.from(next.keys())
      .filter((key) => key.startsWith(`${CONTRACT_USAGE_LIST_FILTER_PREFIX}_`))
      .forEach((key) => next.delete(key))

    if (categoryId) {
      next.set('categoryId', categoryId)
    } else {
      next.delete('categoryId')
    }

    const query = next.toString()

    return query ? `${strippedPathname}?${query}` : strippedPathname
  }

  if (hasError) {
    return (
      <nav className="flex w-58 flex-shrink-0 flex-col gap-1">
        <GenericPlaceholder
          title={translate('text_62c3f3fca8a1625624e83379')}
          subtitle={translate('text_1726498444629i1fpjyvh0kg')}
          buttonTitle={translate('text_1725983967306qz0npfuhlo1')}
          buttonVariant="primary"
          buttonAction={onRetry}
          image={<ErrorImage width="136" height="104" />}
        />
      </nav>
    )
  }

  const standaloneTab = {
    title: translate('text_17918333668416t409ijtqn3'),
    icon: 'circle-dashed' as const,
    link: buildLink(undefined),
    active: activeCategoryId === null,
    canBeClickedOnActive: true,
  }

  return (
    <nav className="flex w-58 flex-shrink-0 flex-col gap-1">
      <VerticalMenu
        loading={isLoading}
        loadingComponent={
          <div className="flex flex-col gap-3 px-3 py-2">
            <Skeleton variant="text" className="w-40" />
            <Skeleton variant="text" className="w-32" />
          </div>
        }
        tabs={[
          ...(showStandalone ? [standaloneTab] : []),
          ...categories.map((category) => ({
            title: category.displayName,
            icon: 'box' as const,
            link: buildLink(category.id),
            active: activeCategoryId === category.id,
            canBeClickedOnActive: true,
          })),
        ]}
      />
    </nav>
  )
}
