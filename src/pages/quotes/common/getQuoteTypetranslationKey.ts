import { QuoteOrderTypeEnum } from './types'

export const getQuoteTypeTranslationKey = (quoteType: QuoteOrderTypeEnum): string => {
  switch (quoteType) {
    case QuoteOrderTypeEnum.oneOff:
      return 'text_1775747115932ib2to4erkoo'
    case QuoteOrderTypeEnum.subscriptionAmendment:
      return 'text_17757471159329jnt7pyy6vr'
    default:
      return 'text_1775747115932u8ttc3l11w1'
  }
}
