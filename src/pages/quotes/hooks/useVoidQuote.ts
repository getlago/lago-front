import { generatePath, useNavigate } from 'react-router-dom'

import { VOID_QUOTE_ROUTE } from '~/core/router'

export const useVoidQuote = () => {
  const navigate = useNavigate()

  const voidQuote = (quoteId: string) => {
    navigate(generatePath(VOID_QUOTE_ROUTE, { quoteId }))
  }

  return { voidQuote }
}
