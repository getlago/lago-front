import { ReactNode } from 'react'

import { findConnectionRouting } from '~/components/connectionSelection/fromConnectionRouting'
import { ConnectionCategory } from '~/components/customerConnections/types'
import { ConnectionCategoryEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { ConnectionRoutingDisplay, ConnectionRoutingValue } from './ConnectionRoutingValue'

export const CONNECTION_CATEGORY_CONNECTION_LABEL_KEYS: Record<ConnectionCategory, string> = {
  [ConnectionCategory.Payment]: 'text_1789557972392jhb3cywzp35',
  [ConnectionCategory.Tax]: 'text_1789557972392kzvs8grsxor',
  [ConnectionCategory.Accounting]: 'text_1789557972392ui25nl8slm3',
  [ConnectionCategory.Crm]: 'text_1728658962985xpfdvl5ru8a',
}

const CONNECTION_CATEGORY_TO_API_CATEGORY: Record<ConnectionCategory, ConnectionCategoryEnum> = {
  [ConnectionCategory.Payment]: ConnectionCategoryEnum.Payment,
  [ConnectionCategory.Tax]: ConnectionCategoryEnum.Tax,
  [ConnectionCategory.Accounting]: ConnectionCategoryEnum.Accounting,
  [ConnectionCategory.Crm]: ConnectionCategoryEnum.Crm,
}

export type ConnectionRoutingRow = ConnectionRoutingDisplay & {
  category: ConnectionCategoryEnum
}

export type ConnectionRoutingGridItem = {
  label: string
  value: ReactNode
}

interface UseConnectionRoutingGridItemsArgs {
  categories: ConnectionCategory[]
  connections?: ConnectionRoutingRow[] | null
  customerId?: string
}

export const useConnectionRoutingGridItems = ({
  categories,
  connections,
  customerId,
}: UseConnectionRoutingGridItemsArgs): ConnectionRoutingGridItem[] => {
  const { translate } = useInternationalization()

  return categories.map((category) => ({
    label: translate(CONNECTION_CATEGORY_CONNECTION_LABEL_KEYS[category]),
    value: (
      <ConnectionRoutingValue
        category={category}
        customerId={customerId}
        routing={findConnectionRouting(connections, CONNECTION_CATEGORY_TO_API_CATEGORY[category])}
      />
    ),
  }))
}
