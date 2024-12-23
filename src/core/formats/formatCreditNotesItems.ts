import chain from 'lodash/chain'
import groupBy from 'lodash/groupBy'

import { CreditNoteItem } from '~/generated/graphql'

const formatCreditNotesItems = (items: CreditNoteItem[] | null | undefined) => {
  return Object.values(
    chain(items)
      .groupBy((item) => item?.fee?.subscription?.id)
      .map((item) => Object.values(groupBy(item, (element) => element?.fee?.charge?.id)))
      .value(),
  )
}

export default formatCreditNotesItems
