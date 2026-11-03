import _ from 'lodash'

import { CreditNoteItem } from '~/generated/graphql'

const formatCreditNotesItems = (items: CreditNoteItem[] | null | undefined) => {
  return Object.values(
    _.chain(items)
      .groupBy((item) => {
        const fee = item?.fee
        if (fee?.subscription?.id) return `subscription:${fee.subscription.id}`
        if (fee?.contractRateCard?.id) return `contract-rate-card:${fee.contractRateCard.id}`

        return 'one-off'
      })
      .map((item) => Object.values(_.groupBy(item, (element) => element?.fee?.charge?.id)))
      .value(),
  )
}

export default formatCreditNotesItems
