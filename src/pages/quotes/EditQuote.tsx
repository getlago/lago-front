import { debounce } from 'lodash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { generatePath, useParams } from 'react-router-dom'

import { Button } from '~/components/designSystem/Button'
import type { OnPricingCommand } from '~/components/designSystem/RichTextEditor/common/RichTextEditorContext'
import RichTextEditor, {
  type RichTextEditorMode,
} from '~/components/designSystem/RichTextEditor/RichTextEditor'
import { Skeleton } from '~/components/designSystem/Skeleton'
import { Status, StatusType } from '~/components/designSystem/Status'
import { Typography } from '~/components/designSystem/Typography'
import { RightAsidePage } from '~/components/layouts/RightAsidePage'
import { QuoteDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { QUOTE_DETAILS_ROUTE, useNavigate } from '~/core/router'
import type { BillingItemsPayload } from '~/core/serializers/serializeQuoteBillingItems'
import { type UpdateQuoteVersionInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import EditQuoteAside from './editQuote/EditQuoteAside'
import { usePricingDrawer } from './hooks/usePricingDrawer'
import { useQuote } from './hooks/useQuote'
import { useUpdateQuote } from './hooks/useUpdateQuote'

const AUTO_SAVE_DELAY_MS = 2000

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const EditQuote = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { quoteId } = useParams()
  const { quote, loading, refetch: refetchQuote } = useQuote(quoteId)

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

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [editorMode, setEditorMode] = useState<RichTextEditorMode>('edit')

  const onUpdateFinished = useCallback(() => {
    setSaveStatus('saved')
  }, [])

  const onUpdateError = useCallback(() => {
    setSaveStatus('error')
  }, [])

  const { updateQuoteVersion, isUpdatingQuoteVersion, isUpdatingQuote } = useUpdateQuote({
    onUpdateFinished,
    onUpdateError,
  })

  const isUpdating = isUpdatingQuote || isUpdatingQuoteVersion

  const { onPricingCommand, entities, syncEntitiesWithBlocks } = usePricingDrawer(
    quote?.orderType,
    quote?.currentVersion?.billingItems,
  )

  const getMarkdownRef = useRef<(() => string) | null>(null)
  const lastSavedContentRef = useRef('')
  const isReadyForChangesRef = useRef(false)
  const failedPayloadRef = useRef<UpdateQuoteVersionInput | null>(null)

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

        if (markdown === null || markdown === undefined || !versionId) return

        const payload: UpdateQuoteVersionInput = { id: versionId, content: markdown }

        failedPayloadRef.current = payload

        try {
          const result = await updateQuoteVersionRef.current(payload, false)

          if (result.data?.updateQuoteVersion) {
            lastSavedContentRef.current = markdown
            failedPayloadRef.current = null
          }
        } catch {
          setSaveStatus('error')
        }
      }, AUTO_SAVE_DELAY_MS),
    [versionId],
  )

  // Compare content instead of blindly trusting onChange — Tiptap fires onChange
  // on initialization and mode switches, not just on real user edits.
  const handleChange = () => {
    const currentContent = getMarkdownRef.current?.() ?? ''

    if (!isReadyForChangesRef.current) return

    if (currentContent === lastSavedContentRef.current) return

    setSaveStatus('saving')
    debouncedSave()
  }

  const handleRetry = useCallback(async () => {
    const payload = failedPayloadRef.current

    if (!payload) return

    setSaveStatus('saving')

    try {
      const result = await updateQuoteVersionRef.current(payload, false)

      if (result.data?.updateQuoteVersion) {
        if ('content' in payload && payload.content) {
          lastSavedContentRef.current = payload.content
        }
        failedPayloadRef.current = null
      }
    } catch {
      setSaveStatus('error')
    }
  }, [])

  const savePricingBlock = useCallback(
    async (billingItems?: BillingItemsPayload) => {
      if (!versionId) return

      const content = getMarkdownRef.current?.()

      if (content === null || content === undefined) return

      setSaveStatus('saving')

      const payload: UpdateQuoteVersionInput = { id: versionId, content, billingItems }

      failedPayloadRef.current = payload

      try {
        const result = await updateQuoteVersionRef.current(payload, false)

        if (result.data?.updateQuoteVersion) {
          lastSavedContentRef.current = content
          failedPayloadRef.current = null
          refetchQuote()
        }
      } catch {
        setSaveStatus('error')
      }
    },
    [versionId, refetchQuote],
  )

  const handleClose = () => {
    debouncedSave.cancel()
    onClose()
  }

  return (
    <RightAsidePage.Wrapper>
      <RightAsidePage.Header
        title={
          <div className="flex flex-row items-center gap-3">
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
                {saveStatus === 'error' ? (
                  <>
                    <Status
                      type={StatusType.warning}
                      label={translate('text_1779437694622y666yr137gm')}
                      endIcon="warning-unfilled"
                    />
                    <Button variant="quaternary" size="small" icon="sync" onClick={handleRetry} />
                  </>
                ) : (
                  <Status
                    type={StatusType.outline}
                    label={translate(
                      saveStatus === 'saving'
                        ? 'text_1779268404389431dgsiiysk'
                        : 'text_1779268404389wpd2ysgatw4',
                    )}
                    endIcon={saveStatus === 'saving' ? 'sync' : 'validate-unfilled'}
                  />
                )}
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
            onSaveStart={() => setSaveStatus('saving')}
            onSaveFinished={onUpdateFinished}
            onSaveError={(payload) => {
              failedPayloadRef.current = payload
              setSaveStatus('error')
            }}
          />
        }
      >
        <RichTextEditor
          content={quote?.currentVersion?.content ?? ''}
          getMarkdownRef={getMarkdownRef}
          onChange={handleChange}
          mode={editorMode}
          onPricingCommand={useCallback<OnPricingCommand>(
            ({ onSave, editData }) => {
              onPricingCommand({
                onSave: (attrs, entityData, billingItems) => {
                  // 1. Insert/update the TipTap node (existing behavior)
                  onSave(attrs, entityData, billingItems)
                  // 2. Unified save: content + billingItems together
                  savePricingBlock(billingItems)
                },
                editData,
              })
            },
            [onPricingCommand, savePricingBlock],
          )}
          entities={entities}
          onPricingBlocksChange={useCallback(
            (blocks) => {
              const updatedBillingItems = syncEntitiesWithBlocks(blocks)

              if (updatedBillingItems) {
                savePricingBlock(updatedBillingItems)
              }
            },
            [syncEntitiesWithBlocks, savePricingBlock],
          )}
        />
      </RightAsidePage.Content>
    </RightAsidePage.Wrapper>
  )
}

export default EditQuote
