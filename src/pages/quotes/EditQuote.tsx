import { debounce } from 'lodash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { generatePath, useParams } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import RichTextEditor, {
  type RichTextEditorMode,
} from '~/components/designSystem/RichTextEditor/RichTextEditor'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Status, StatusType } from '~/components/designSystem/Status'
import { Typography } from '~/components/designSystem/Typography'
import { RightAsidePage } from '~/components/layouts/RightAsidePage'
import { QuoteDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { QUOTE_DETAILS_ROUTE, useNavigate } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import EditQuoteAside from './editQuote/EditQuoteAside'
import { useQuote } from './hooks/useQuote'
import { useUpdateQuote } from './hooks/useUpdateQuote'

const AUTO_SAVE_DELAY_MS = 2000

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

  const [isSaving, setIsSaving] = useState(false)
  const [editorMode, setEditorMode] = useState<RichTextEditorMode>('edit')

  const onUpdateFinished = useCallback(() => {
    setIsSaving(false)
  }, [])

  const { updateQuoteVersion, isUpdatingQuoteVersion, isUpdatingQuote } = useUpdateQuote({
    onUpdateFinished,
  })

  const isUpdating = isUpdatingQuote || isUpdatingQuoteVersion

  const getMarkdownRef = useRef<(() => string) | null>(null)
  const lastSavedContentRef = useRef('')
  const isReadyForChangesRef = useRef(false)

  // Arm change detection after the editor has fully initialized.
  // Tiptap fires multiple onChange events during setup — we wait for the
  // call stack to clear before starting to track real user edits.
  useEffect(() => {
    if (!quote) return

    const timer = setTimeout(() => {
      const baseline = getMarkdownRef.current?.() ?? ''

      lastSavedContentRef.current = baseline
      isReadyForChangesRef.current = true
    }, 0)

    return () => clearTimeout(timer)
  }, [quote])

  const updateQuoteVersionRef = useRef(updateQuoteVersion)

  updateQuoteVersionRef.current = updateQuoteVersion

  const debouncedSave = useMemo(
    () =>
      debounce(async () => {
        const markdown = getMarkdownRef.current?.()

        if (!markdown || !versionId) return

        await updateQuoteVersionRef.current({ id: versionId, content: markdown }, false)
        lastSavedContentRef.current = markdown
      }, AUTO_SAVE_DELAY_MS),
    [versionId],
  )

  // Compare content instead of blindly trusting onChange — Tiptap fires onChange
  // on initialization and mode switches, not just on real user edits.
  const handleChange = () => {
    const currentContent = getMarkdownRef.current?.() ?? ''

    if (!isReadyForChangesRef.current) return

    if (currentContent === lastSavedContentRef.current) return

    setIsSaving(true)
    debouncedSave()
  }

  const handleClose = () => {
    debouncedSave.cancel()
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
                <Status
                  type={StatusType.outline}
                  label={translate(
                    isSaving ? 'text_1779268404389431dgsiiysk' : 'text_1779268404389wpd2ysgatw4',
                  )}
                  endIcon={isSaving ? 'sync' : 'validate-filled'}
                />
              </>
            )}
          </div>
        }
        onClose={handleClose}
        isCloseButtonDisabled={isUpdating}
      >
        <Button
          variant="tertiary"
          onClick={() => setEditorMode((m) => (m === 'edit' ? 'preview' : 'edit'))}
        >
          {translate(
            editorMode === 'edit'
              ? 'text_17792789377356rxkbkmpu81'
              : 'text_1779278937735vlpgsllouzy',
          )}
        </Button>
      </RightAsidePage.Header>
      <RightAsidePage.Content
        aside={
          <EditQuoteAside
            quote={quote}
            onSaveStart={() => setIsSaving(true)}
            onSaveFinished={onUpdateFinished}
          />
        }
      >
        <RichTextEditor
          content={quote?.currentVersion?.content ?? ''}
          getMarkdownRef={getMarkdownRef}
          onChange={handleChange}
          mode={editorMode}
        />
      </RightAsidePage.Content>
    </RightAsidePage.Wrapper>
  )
}

export default EditQuote
