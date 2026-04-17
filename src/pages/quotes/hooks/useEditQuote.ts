import { generatePath, useNavigate } from 'react-router-dom'

import { EDIT_QUOTE_ROUTE } from '~/core/router'

export const useEditQuote = () => {
  const navigate = useNavigate()

  const editQuote = (quoteId: string) => {
    navigate(generatePath(EDIT_QUOTE_ROUTE, { quoteId }))
  }

  return { editQuote }
}
