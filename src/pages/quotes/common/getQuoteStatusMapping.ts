import { StatusType } from '~/components/designSystem/Status'

import { QuoteStatusEnum } from './types'

export const getQuoteStatusMapping = (
  status: QuoteStatusEnum,
  translate: (key: string) => string,
) => {
  switch (status) {
    case QuoteStatusEnum.draft:
      return { type: StatusType.outline, label: 'draft' as const }
    case QuoteStatusEnum.approved:
      return { type: StatusType.success, label: translate('text_1775747115932eu6r3ejjoox') }
    case QuoteStatusEnum.voided:
      return { type: StatusType.disabled, label: 'voided' as const }
  }
}
