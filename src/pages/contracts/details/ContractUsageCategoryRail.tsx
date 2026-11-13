import { gql } from '@apollo/client'
import { useMemo } from 'react'
import { useSearchParams } from 'react-router'

import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { VerticalMenu } from '~/components/designSystem/VerticalMenu'
import { useLocation } from '~/core/router'
import { useGetContractUsageCategoriesQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useRefetchOnTokenChange } from '~/hooks/useRefetchOnTokenChange'
import ErrorImage from '~/public/images/maneki/error.svg'

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
  refreshToken?: number
}

export const ContractUsageCategoryRail = ({
  contractId,
  refreshToken,
}: ContractUsageCategoryRailProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { strippedPathname } = useLocation()
  const [searchParams] = useSearchParams()
  const activeCategoryId = searchParams.get('categoryId')

  const { data, error, refetch } = useGetContractUsageCategoriesQuery({ variables: { contractId } })

  useRefetchOnTokenChange(refreshToken, refetch)

  const categories = useMemo(() => {
    const byId = new Map<string, string>()

    data?.contract?.appliedRateCards.forEach((card) => {
      const category = card.product.productCategory

      if (category) byId.set(category.id, category.name)
    })

    return Array.from(byId, ([id, name]) => ({ id, name })).toSorted((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true }),
    )
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

  if (error) {
    return (
      <nav className="flex w-58 flex-shrink-0 flex-col gap-1">
        <GenericPlaceholder
          title={translate('text_62c3f3fca8a1625624e83379')}
          subtitle={translate('text_1726498444629i1fpjyvh0kg')}
          buttonTitle={translate('text_1725983967306qz0npfuhlo1')}
          buttonVariant="primary"
          buttonAction={refetch}
          image={<ErrorImage width="136" height="104" />}
        />
      </nav>
    )
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
