import { gql } from '@apollo/client'
import { generatePath, useNavigate } from 'react-router-dom'

import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import { addToast } from '~/core/apolloClient'
import { EDIT_QUOTE_ROUTE } from '~/core/router'
import { useCloneQuoteMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation cloneQuote($input: CloneQuoteInput!) {
    cloneQuote(input: $input) {
      id
    }
  }
`

export const useCloneQuote = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const dialog = useCentralizedDialog()

  const [cloneQuote] = useCloneQuoteMutation({
    onCompleted({ cloneQuote: clonedQuote }) {
      if (clonedQuote) {
        addToast({
          severity: 'success',
          translateKey: 'text_1776414006125wn9p70fx8qg',
        })

        navigate(
          generatePath(EDIT_QUOTE_ROUTE, {
            quoteId: clonedQuote.id,
          }),
        )
      }
    },
    refetchQueries: ['getQuotes'],
  })

  const openCloneDialog = (quoteId: string) => {
    dialog.open({
      title: translate('text_1776414006125wn9p70fx8qg'),
      description: translate('text_1776414006125pkw558zpwid'),
      actionText: translate('text_1776414006125wn9p70fx8qg'),
      onAction: async () => {
        await cloneQuote({
          variables: { input: { id: quoteId } },
        })

        return { reason: 'success' } as const
      },
    })
  }

  return { openCloneDialog }
}
