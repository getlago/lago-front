import { generatePath, useNavigate } from 'react-router-dom'

import { APPROVE_QUOTE_ROUTE } from '~/core/router'

export const useApproveQuote = () => {
  const navigate = useNavigate()

  const goToApproveQuote = (quoteId: string, versionId: string) => {
    navigate(generatePath(APPROVE_QUOTE_ROUTE, { quoteId, versionId }))
  }

  const approveQuote = () => true

  return { goToApproveQuote, approveQuote }
}
