import { gql } from '@apollo/client'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router'

import { VerticalMenu } from '~/components/designSystem/VerticalMenu'
import { findNearestScrollableAncestor } from '~/components/designSystem/VirtualList/findNearestScrollableAncestor'
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

// refreshToken: bump to re-fetch in place (not remount) - a remount would also reset sibling
// panes' own local state (search term, page size). See ContractUsageSection.
type ContractUsageCategoryRailProps = {
  contractId: string
  onErrorChange?: (hasError: boolean) => void
  refreshToken?: number
}

export const ContractUsageCategoryRail = ({
  contractId,
  onErrorChange,
  refreshToken,
}: ContractUsageCategoryRailProps): JSX.Element => {
  const { translate } = useInternationalization()
  const { strippedPathname } = useLocation()
  const [searchParams] = useSearchParams()
  const activeCategoryId = searchParams.get('categoryId')

  const { data, error, refetch } = useGetContractUsageCategoriesQuery({ variables: { contractId } })

  useEffect(() => {
    onErrorChange?.(!!error)
  }, [error, onErrorChange])

  const navRef = useRef<HTMLElement>(null)

  // Viewport-bottom-minus-current-top, not a fixed height: `sticky top-0` sits below the page
  // header until scrolled there. Mirrors PlanDetailsV2LeftSidebar's own sticky-nav sizing.
  useLayoutEffect(() => {
    const element = navRef.current

    if (!element) return

    const pageScrollElement = findNearestScrollableAncestor(element)

    const resizeToViewport = (): void => {
      element.style.maxHeight = `${window.innerHeight - element.getBoundingClientRect().top}px`
    }

    resizeToViewport()
    window.addEventListener('resize', resizeToViewport)
    pageScrollElement?.addEventListener('scroll', resizeToViewport, { passive: true })

    const bodyObserver = new ResizeObserver(resizeToViewport)

    bodyObserver.observe(document.body)

    return () => {
      window.removeEventListener('resize', resizeToViewport)
      pageScrollElement?.removeEventListener('scroll', resizeToViewport)
      bodyObserver.disconnect()
    }
  }, [])

  const isFirstRefreshRender = useRef(true)

  useEffect(() => {
    if (isFirstRefreshRender.current) {
      isFirstRefreshRender.current = false
      return
    }
    refetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshToken])

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

  return (
    <nav
      ref={navRef}
      className="sticky top-0 flex min-h-0 w-58 flex-shrink-0 flex-col gap-1 overflow-y-auto"
    >
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
