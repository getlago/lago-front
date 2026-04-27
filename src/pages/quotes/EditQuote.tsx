import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import RichTextEditor from '~/components/designSystem/RichTextEditor/RichTextEditor'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Status } from '~/components/designSystem/Status'
import { Typography } from '~/components/designSystem/Typography'
import { RightAsidePage } from '~/components/layouts/RightAsidePage'
import { QuoteDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { QUOTE_DETAILS_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { getQuoteStatusMapping } from './common/getQuoteStatusMapping'
import { useQuote } from './hooks/useQuote'

export const EDIT_QUOTE_SAVE_BUTTON_TEST_ID = 'edit-quote-save-button'

const EditQuote = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { quoteId } = useParams()
  const { quote, loading } = useQuote(quoteId)

  const onClose = () => {
    if (quoteId) {
      navigate(
        generatePath(QUOTE_DETAILS_ROUTE, {
          quoteId,
          tab: QuoteDetailsTabsOptionsEnum.overview,
        }),
      )
    }
  }

  return (
    <RightAsidePage.Wrapper>
      <RightAsidePage.Header
        title={
          <div className="flex flex-row items-center gap-2">
            {loading && (
              <>
                <Skeleton variant="text" className="w-40" />
                <Skeleton variant="text" className="w-12" />
              </>
            )}
            {!loading && quote && (
              <>
                <Typography variant="bodyHl" color="grey700">
                  {quote.number} - v{quote.version}
                </Typography>
                <Status {...getQuoteStatusMapping(quote.status, translate)} />
              </>
            )}
          </div>
        }
        onClose={onClose}
      >
        <Button variant="secondary" data-testid={EDIT_QUOTE_SAVE_BUTTON_TEST_ID} onClick={onClose}>
          {translate('text_1776414006125387qynzm000')}
        </Button>
      </RightAsidePage.Header>
      <RightAsidePage.Content aside={<div />}>
        <RichTextEditor />
      </RightAsidePage.Content>
    </RightAsidePage.Wrapper>
  )
}

export default EditQuote
