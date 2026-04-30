import { debounce } from 'lodash'
import { useRef } from 'react'
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
import EditQuoteAside from './editQuote/EditQuoteAside'
import { useQuote } from './hooks/useQuote'
import { useUpdateQuote } from './hooks/useUpdateQuote'

const AUTO_SAVE_DELAY_MS = 2000

export const EDIT_QUOTE_SAVE_BUTTON_TEST_ID = 'edit-quote-save-button'

const EditQuote = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { quoteId } = useParams()
  const { quote, loading } = useQuote(quoteId)

  const versionId = quote?.currentVersion?.id

  const onClose = () => {
    if (!quoteId) return
    navigate(
      generatePath(QUOTE_DETAILS_ROUTE, {
        quoteId,
        tab: QuoteDetailsTabsOptionsEnum.overview,
      }),
    )
  }

  const { updateQuoteVersion, isUpdatingQuoteVersion, isUpdatingQuote } = useUpdateQuote()

  const isUpdating = isUpdatingQuote || isUpdatingQuoteVersion

  const getMarkdownRef = useRef<(() => string) | null>(null)
  const hasInitializedRef = useRef(false)

  const handleChange = () => {
    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true
      return
    }
    debouncedSave()
  }

  const debouncedSave = debounce(async () => {
    const markdown = getMarkdownRef.current?.()

    if (!markdown || !versionId) return

    await updateQuoteVersion({ id: versionId, content: markdown }, false)
  }, AUTO_SAVE_DELAY_MS)

  const handleSaveContent = async () => {
    debouncedSave.cancel()

    const markdown = getMarkdownRef.current?.()

    if (!versionId || !markdown) return

    await updateQuoteVersion({ id: versionId, content: markdown })

    onClose()
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
                  {quote.number} - v{quote.currentVersion.version}
                </Typography>
                <Status {...getQuoteStatusMapping(quote.currentVersion.status, translate)} />
              </>
            )}
          </div>
        }
        onClose={onClose}
        isCloseButtonDisabled={isUpdating}
      >
        <Button
          variant="secondary"
          data-testid={EDIT_QUOTE_SAVE_BUTTON_TEST_ID}
          onClick={handleSaveContent}
          disabled={isUpdating}
          loading={isUpdating}
        >
          {translate('text_1776414006125387qynzm000')}
        </Button>
      </RightAsidePage.Header>
      <RightAsidePage.Content aside={<EditQuoteAside quote={quote} />}>
        <RichTextEditor
          content={quote?.currentVersion?.content ?? ''}
          getMarkdownRef={getMarkdownRef}
          onChange={handleChange}
        />
      </RightAsidePage.Content>
    </RightAsidePage.Wrapper>
  )
}

export default EditQuote
