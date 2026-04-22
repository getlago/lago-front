import { generatePath, useNavigate } from 'react-router-dom'

import { APPROVE_QUOTE_ROUTE } from '~/core/router'

export const useApproveQuote = () => {
  const navigate = useNavigate()

  const approveQuote = (quoteId: string) => {
    navigate(generatePath(APPROVE_QUOTE_ROUTE, { quoteId }))
  }

  return { approveQuote }
}
