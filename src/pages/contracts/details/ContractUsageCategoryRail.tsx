import { gql } from '@apollo/client'
import { useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router'

import { VerticalMenu } from '~/components/designSystem/VerticalMenu'
import { useLocation } from '~/core/router'
import { useGetContractUsageCategoriesQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  query getContractUsageCategories($contractId: ID!) {
    contract(id: $contractId) {
      id
      appliedRateCards {
        id
        product {
          id
          productCategory {
            id
            name
          }
        }
      }
    }
  }
`

type ContractUsageCategoryRailProps = {
  contractId: string
  onErrorChange?: (hasError: boolean) => void
}

export const ContractUsageCategoryRail = ({
  contractId,
  onErrorChange,
}: ContractUsageCategoryRailProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { strippedPathname } = useLocation()
  const [searchParams] = useSearchParams()
  const activeCategoryId = searchParams.get('categoryId')

  const { data, error } = useGetContractUsageCategoriesQuery({ variables: { contractId } })

  useEffect(() => {
    onErrorChange?.(!!error)
  }, [error, onErrorChange])

  const categories = useMemo(() => {
    const byId = new Map<string, string>()

    data?.contract?.appliedRateCards.forEach((card) => {
      const category = card.product.productCategory

      if (category) byId.set(category.id, category.name)
    })

    return Array.from(byId, ([id, name]) => ({ id, name }))
  }, [data])

  // Switching category must keep the active filters/search term (they live in the same search
  // params) but drop `page` - a category switch starts back at page 1.
  const buildLink = (categoryId: string | undefined): string => {
    const next = new URLSearchParams(searchParams)

    next.delete('page')
    if (categoryId) {
      next.set('categoryId', categoryId)
    } else {
      next.delete('categoryId')
    }

    const query = next.toString()

    return query ? `${strippedPathname}?${query}` : strippedPathname
  }

  return (
    <nav className="flex w-58 flex-shrink-0 flex-col gap-1">
      <VerticalMenu
        tabs={[
          {
            title: translate('text_17918333668416t409ijtqn3'),
            icon: 'folder-close',
            link: buildLink(undefined),
            active: !activeCategoryId,
            canBeClickedOnActive: true,
          },
          ...categories.map((category) => ({
            title: category.name,
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
