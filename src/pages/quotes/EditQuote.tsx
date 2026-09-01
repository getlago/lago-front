import { ApolloError } from '@apollo/client'
import type { GraphQLFormattedError } from 'graphql'
import { debounce } from 'lodash'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { generatePath, useParams } from 'react-router-dom'

import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import type {
  OnCreditsCommand,
  OnDiscountCommand,
  OnPricingCommand,
} from '~/components/designSystem/RichTextEditor/common/RichTextEditorContext'
import { CreditsBlockAttributes } from '~/components/designSystem/RichTextEditor/extensions/CreditsBlock.schema'
import { DiscountBlockAttributes } from '~/components/designSystem/RichTextEditor/extensions/DiscountBlock.schema'
import { PricingBlockAttributes } from '~/components/designSystem/RichTextEditor/extensions/PricingBlock.schema'
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
import type { Locale } from '~/core/translations'
import { CurrencyEnum, OrderTypeEnum, type UpdateQuoteVersionInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { QUOTE_MENTION_VARIABLES } from '~/pages/quotes/common/mentionVariables'

import EditQuoteAside from './editQuote/EditQuoteAside'
import { useAddQuoteImage } from './hooks/useAddQuoteImage'
import { useCreditsDrawer } from './hooks/useCreditsDrawer'
import { useDiscountDrawer } from './hooks/useDiscountDrawer'
import { useOneOffPricingDrawer } from './hooks/useOneOffPricingDrawer'
import { useQuote } from './hooks/useQuote'
import { useSubscriptionPricingDrawer } from './hooks/useSubscriptionPricingDrawer'
import { useUpdateQuote } from './hooks/useUpdateQuote'

const AUTO_SAVE_DELAY_MS = 2000

export const EDIT_QUOTE_PRICING_CTA_TEST_ID = 'edit-quote-pricing-cta'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export type SavePricingResult =
  { ok: true } | { ok: false; error: ApolloError | readonly GraphQLFormattedError[] | undefined }

const EditQuote = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { quoteId } = useParams()
  const { quote, loading, refetch: refetchQuote } = useQuote(quoteId)
  const { organization } = useOrganizationInfos()

  const { addQuoteImage } = useAddQuoteImage()
  // quote.images is the single source of truth — useAddQuoteImage writes each
  // uploaded blob into the normalized Quote.images cache field, so it updates
  // reactively here (on-screen editor) and everywhere quote.images is read.
  const images = (quote?.images ?? {}) as Record<string, string>

  const onImageUpload = useCallback(
    async (base64: string): Promise<string> => {
      if (!quoteId) throw new Error('Missing quote id')

      const { id } = await addQuoteImage({ id: quoteId, image: base64 })

      return id
    },
    [quoteId, addQuoteImage],
  )

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

  // The amended subscription owns the start date: it is neither displayed nor sent (LAGO-1814).
  const isAmendment = quote?.orderType === OrderTypeEnum.SubscriptionAmendment

  const isSubscriptionOrder = quote?.orderType === OrderTypeEnum.SubscriptionCreation || isAmendment

  // The quote version currency is the source of truth for every amount shown or
  // serialized in this quote. Until it is set (legacy quotes, or before the
  // backfill below lands), fall back to the customer's, then the organization's.
  const quoteVersionCurrency = quote?.currentVersion?.currency as CurrencyEnum | undefined
  const effectiveQuoteCurrency =
    quoteVersionCurrency ??
    quote?.customer?.currency ??
    organization?.defaultCurrency ??
    CurrencyEnum.Usd

  const quoteNetPaymentTerm =
    quote?.customer.netPaymentTerm ?? quote?.customer.billingEntity.netPaymentTerm

  const subscriptionPricing = useSubscriptionPricingDrawer(quote?.currentVersion?.billingItems, {
    customer: quote?.customer,
    netPaymentTerm: quoteNetPaymentTerm,
    subscriptionId: quote?.subscription?.id,
    currency: effectiveQuoteCurrency,
    hasQuoteCurrency: !!quoteVersionCurrency,
    isAmendment,
  })
  const oneOffPricing = useOneOffPricingDrawer(quote?.currentVersion?.billingItems, {
    currency: effectiveQuoteCurrency,
    hasQuoteCurrency: !!quoteVersionCurrency,
    netPaymentTerm: quoteNetPaymentTerm,
  })

  const { onPricingCommand, isPricingDisabled, entities, syncEntitiesWithBlocks } =
    isSubscriptionOrder ? subscriptionPricing : oneOffPricing

  // Stable ref so useDiscountDrawer can call savePricingBlock without a
  // forward-declaration error (savePricingBlock is defined below).
  const savePricingBlockRef = useRef<
    (billingItems?: BillingItemsPayload, currency?: CurrencyEnum) => Promise<SavePricingResult>
  >(async () => ({ ok: true }))

  const discount = useDiscountDrawer(quote?.currentVersion?.billingItems, {
    currency: effectiveQuoteCurrency,
    onPersist: (billingItems) => savePricingBlockRef.current(billingItems),
    onRemoveBlock: (localId) => {
      isRollingBackRef.current = true
      removeBlockRef.current?.(localId)
      isRollingBackRef.current = false
    },
  })

  const credits = useCreditsDrawer(quote?.currentVersion?.billingItems, {
    currency: effectiveQuoteCurrency,
    onPersist: (billingItems) => savePricingBlockRef.current(billingItems),
    onRemoveBlock: (localId) => {
      isRollingBackRef.current = true
      removeBlockRef.current?.(localId)
      isRollingBackRef.current = false
    },
  })

  const mergedEntities = useMemo(
    () => ({ ...entities, ...discount.entities, ...credits.entities }),
    [entities, discount.entities, credits.entities],
  )

  // `isPricingDisabled()` reads a ref, so it cannot drive a render. Until the editor has
  // reported its blocks the saved billingItems stand in, so a priced quote never paints the CTA.
  const savedBillingItems = quote?.currentVersion?.billingItems as BillingItemsPayload | undefined
  const hasSavedPricing = !!(savedBillingItems?.plans?.length || savedBillingItems?.addOns?.length)
  const [hasPricingBlockInDocument, setHasPricingBlockInDocument] = useState<boolean | null>(null)
  const hasPricingBlock = hasPricingBlockInDocument ?? hasSavedPricing

  const pricingSummary = useMemo(() => {
    // The pricing hooks index each add-on twice — by localId and by catalog id, for
    // backward compat with older documents — so the names must be deduped by entityId.
    const seen = new Set<string>()
    const names: string[] = []

    for (const entity of Object.values(entities)) {
      if (!entity || seen.has(entity.entityId)) continue

      seen.add(entity.entityId)
      names.push(entity.invoiceDisplayName || entity.name)
    }

    return names.join(', ')
  }, [entities])

  const customerLocale = (quote?.customer?.billingConfiguration?.documentLocale ?? 'en') as Locale

  const getMarkdownRef = useRef<(() => string) | null>(null)
  const removeBlockRef = useRef<((localId: string) => void) | null>(null)
  const insertPricingBlockRef = useRef<(() => void) | null>(null)

  // Runs the very command the slash menu's "Pricing" item runs, so the save, the rollback
  // and the selection fix-up stay in one place.
  const handleAddPricingBlock = useCallback(() => {
    insertPricingBlockRef.current?.()
  }, [])
  const isRollingBackRef = useRef(false)
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

  // Quotes are no longer given a currency at creation time, so the edit page is
  // where one gets materialized: persist the customer's (or the organization's)
  // currency once, so every amount below has a real currency behind it.
  const backfilledVersionIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!versionId || quoteVersionCurrency) return
    if (isAmendment) return
    if (backfilledVersionIdRef.current === versionId) return

    backfilledVersionIdRef.current = versionId

    updateQuoteVersionRef
      .current({ id: versionId, currency: effectiveQuoteCurrency }, false)
      .catch(() => undefined)
  }, [versionId, quoteVersionCurrency, effectiveQuoteCurrency, isAmendment])

  const debouncedSave = useMemo(
    () =>
      debounce(async () => {
        const markdown = getMarkdownRef.current?.()

        if (markdown === null || markdown === undefined || !versionId) return

        // A pricing save that failed leaves its block in the content with its billing item
        // unsaved, so the content is never sent on its own from here on: carrying the
        // rejected items along means the two either land together or fail together, instead
        // of the content quietly persisting a block nothing backs.
        const unsavedBillingItems = failedPayloadRef.current?.billingItems

        const payload: UpdateQuoteVersionInput = {
          id: versionId,
          content: markdown,
          ...(unsavedBillingItems ? { billingItems: unsavedBillingItems } : {}),
        }

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

  const mentionItems = useMemo(
    () => QUOTE_MENTION_VARIABLES.map((v) => ({ id: v.id, label: translate(v.labelKey) })),
    [translate],
  )

  const mentionValues = useMemo(
    () => (quote?.currentVersion?.mentionVariables ?? {}) as Record<string, string>,
    [quote?.currentVersion?.mentionVariables],
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

  // Keep the ref in sync with the latest savePricingBlock so the stable wrapper
  // passed to useDiscountDrawer always calls the current version.
  const savePricingBlock = useCallback(
    async (
      billingItems?: BillingItemsPayload,
      currency?: CurrencyEnum,
    ): Promise<SavePricingResult> => {
      if (!versionId) return { ok: true }

      const content = getMarkdownRef.current?.()

      if (content === null || content === undefined) return { ok: true }

      // The block insertion this save follows already scheduled a content-only autosave.
      // It would land after this one and report success for a content whose billing items
      // were rejected, so the pricing save takes ownership of the pending content.
      debouncedSave.cancel()

      setSaveStatus('saving')

      // Each drawer owns a single billingItems category and already merges its
      // partial ({ plans } / { addOns } / { coupons }) over the current items,
      // so the payload is sent as-is — no key is fabricated here (a stray
      // `addOns: []` would otherwise leak onto subscription quotes).
      const payload: UpdateQuoteVersionInput = {
        id: versionId,
        content,
        billingItems,
        // Set only when the selected billing item is defining the quote currency
        // — an existing currency is never overwritten from here.
        ...(currency ? { currency } : {}),
      }

      failedPayloadRef.current = payload

      try {
        const result = await updateQuoteVersionRef.current(payload, false)

        if (result.data?.updateQuoteVersion && !result.errors?.length) {
          lastSavedContentRef.current = content
          failedPayloadRef.current = null
          refetchQuote()

          return { ok: true }
        }

        // The drawer surfaces the failure too (toast, and it stays open on its own), but
        // the header cannot stay silent: `idle` renders the very same "Saved" chip as a
        // successful save, so a rejected save would read as a saved one. The error chip
        // also exposes the retry, which resends the payload kept above.
        setSaveStatus('error')

        return { ok: false, error: result.errors }
      } catch (error) {
        setSaveStatus('error')

        return { ok: false, error: error as ApolloError }
      }
    },
    [versionId, refetchQuote, debouncedSave],
  )

  savePricingBlockRef.current = savePricingBlock

  const handlePricingCommand = useCallback<OnPricingCommand>(
    ({ onSave, editData }) => {
      onPricingCommand({
        onSave: async (attrs, entityData, billingItems, currency) => {
          // 1. Insert/update the TipTap node (needed so the save serializes it).
          onSave(attrs, entityData, billingItems)

          // 2. Unified save: content + billingItems (+ the seeded currency) together.
          const result = await savePricingBlock(billingItems, currency)

          // 3. Roll back only a *newly inserted* node on failure — remove the
          // phantom block that never saved. When editing an existing block
          // (`editData`), do NOT remove it: the drawer stays open on a fixable
          // error and the resubmit path is `updateAttributes`, which can't
          // resurrect a deleted node — removing it would lose saved pricing.
          if (!result.ok && !editData) {
            const localId = attrs.localEntityIds?.[0] ?? attrs.entityIds?.[0]

            if (localId) {
              isRollingBackRef.current = true
              removeBlockRef.current?.(localId)
              isRollingBackRef.current = false

              // The rolled-back insert leaves the document back on what is stored, so
              // there is nothing left to retry — and the header can say saved again
              // without lying. A failed *edit* keeps both its block and its retry.
              failedPayloadRef.current = null
              setSaveStatus('idle')
            }
          }

          return result
        },
        editData,
      })
    },
    [onPricingCommand, savePricingBlock],
  )

  const handlePricingBlocksChange = useCallback(
    (blocks: PricingBlockAttributes[]) => {
      // Before the rollback guard below: a rolled-back insert must still clear the flag,
      // only the corrective save is skipped.
      setHasPricingBlockInDocument(blocks.length > 0)

      // A rollback tears the block back out after a failed save. Skip
      // reconciliation entirely — not just the corrective save: otherwise
      // `syncEntitiesWithBlocks` prunes the just-failed add-on's cached catalog
      // payload, and a corrected resubmit (which rebuilds the wire payload from
      // that cache) crashes in `toBillingItems` on the now-missing baseline.
      if (isRollingBackRef.current) return

      const updatedBillingItems = syncEntitiesWithBlocks(blocks)

      if (updatedBillingItems) {
        savePricingBlock(updatedBillingItems)
      }
    },
    [syncEntitiesWithBlocks, savePricingBlock],
  )

  const handleDiscountCommand = useCallback<OnDiscountCommand>(
    ({ onSave, editData }) => {
      discount.onDiscountCommand({ onSave, editData })
    },
    [discount],
  )

  const handleDiscountBlocksChange = useCallback(
    (blocks: DiscountBlockAttributes[]) => {
      // See handlePricingBlocksChange: skip reconciliation during a rollback so
      // the failed coupon's cached payload isn't pruned, which would break a
      // corrected resubmit.
      if (isRollingBackRef.current) return

      const updated = discount.syncDiscountBlocks(blocks)

      if (updated) {
        savePricingBlock(updated)
      }
    },
    [discount, savePricingBlock],
  )

  const handleCreditsCommand = useCallback<OnCreditsCommand>(
    ({ onSave, editData }) => {
      credits.onCreditsCommand({ onSave, editData })
    },
    [credits],
  )

  const handleCreditsBlocksChange = useCallback(
    (blocks: CreditsBlockAttributes[]) => {
      // Unlike handlePricingBlocksChange, we don't skip the whole reconciliation
      // during a rollback: syncCreditsBlocks must still refresh the wallet-cap
      // count, or a rolled-back create leaves it stale and wrongly disables
      // /credits until the next edit. We only skip the pruning branch during a
      // rollback so the failed wallet's cached payload survives a corrected
      // resubmit (prune:false also returns undefined → no corrective save).
      const updated = credits.syncCreditsBlocks(blocks, {
        prune: !isRollingBackRef.current,
      })

      if (updated) {
        savePricingBlock(updated)
      }
    },
    [credits, savePricingBlock],
  )

  const handleClose = () => {
    debouncedSave.cancel()
    onClose()
  }

  // Discount + credits are subscription-only; gate the whole set of commands
  // once here instead of per-prop, which keeps the JSX (and the component's
  // cognitive complexity) low.
  const subscriptionEditorProps = isSubscriptionOrder
    ? {
        onDiscountCommand: handleDiscountCommand,
        onCreditsCommand: handleCreditsCommand,
        isCreditsDisabled: credits.isCreditsDisabled,
        onCreditsBlocksChange: handleCreditsBlocksChange,
      }
    : {}

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
            isSaving={saveStatus === 'saving'}
            hasPricingBlock={hasPricingBlock}
            pricingSummary={pricingSummary}
            onAddPricingBlock={handleAddPricingBlock}
            onSaveStart={() => setSaveStatus('saving')}
            onSaveFinished={onUpdateFinished}
            onSaveError={(payload) => {
              failedPayloadRef.current = payload
              setSaveStatus('error')
            }}
          />
        }
      >
        {loading ? (
          <div className="mx-auto my-4 flex max-w-4xl flex-col gap-4 px-10">
            <Skeleton variant="text" className="w-3/4" />
            <Skeleton variant="text" className="w-1/2" />
            <Skeleton variant="text" className="w-5/6" />
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1">
              <RichTextEditor
                content={quote?.currentVersion?.content ?? ''}
                getMarkdownRef={getMarkdownRef}
                removeBlockRef={removeBlockRef}
                insertPricingBlockRef={insertPricingBlockRef}
                onChange={handleChange}
                mode={editorMode}
                onPricingCommand={handlePricingCommand}
                isPricingDisabled={isPricingDisabled}
                entities={mergedEntities}
                onPricingBlocksChange={handlePricingBlocksChange}
                onDiscountBlocksChange={handleDiscountBlocksChange}
                {...subscriptionEditorProps}
                customerLocale={customerLocale}
                documentCurrency={effectiveQuoteCurrency}
                variableItems={mentionItems}
                mentionValues={mentionValues}
                images={images}
                onImageUpload={onImageUpload}
              />
            </div>
            {!hasPricingBlock && (
              <div className="mx-auto w-full max-w-4xl shrink-0 px-10 pb-4">
                <Alert
                  type="warning"
                  data-test={EDIT_QUOTE_PRICING_CTA_TEST_ID}
                  ButtonProps={{
                    label: translate('text_1788277738981ng58j3nfudd'),
                    onClick: handleAddPricingBlock,
                  }}
                >
                  {translate('text_1788277738980lq42krzk56z')}
                </Alert>
              </div>
            )}
          </div>
        )}
      </RightAsidePage.Content>
    </RightAsidePage.Wrapper>
  )
}

export default EditQuote
