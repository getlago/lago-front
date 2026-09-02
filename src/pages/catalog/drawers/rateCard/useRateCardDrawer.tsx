import { FetchResult, gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { generatePath, useParams } from 'react-router-dom'

import { useCreateMore } from '~/components/drawers/createMore/useCreateMore'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { RateCardDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { applyExistingCodeError } from '~/core/form/existingCodeError'
import { RATE_CARD_DETAILS_ROUTE, useNavigate } from '~/core/router'
import { prependOrgSlug } from '~/core/router/utils/prependOrgSlug'
import { escapeDoubleQuotes } from '~/core/utils/escapeDoubleQuotes'
import {
  LagoApiError,
  RateCardBillingTimingEnum,
  RateCardForDrawerFragment,
  useCreateRateCardMutation,
  useUpdateRateCardMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import {
  buildPricingInput,
  mapInvoiceFieldsToStrategy,
  mapStrategyToInvoiceFields,
  PRICING_UNIT_CURRENCY_OPTION,
  RATE_CARD_FORM_DEFAULTS,
  RATE_CARD_FORM_ID,
  RATE_CARD_FORM_SUBMIT_TEST_ID,
  rateCardDrawerSchema,
  RateCardFormValues,
} from './constants'
import {
  type RateCardComboboxSeed,
  RateCardDrawerContent,
  type RateCardProductSeed,
} from './RateCardDrawerContent'

gql`
  fragment RateCardForDrawer on RateCard {
    id
    name
    code
    description
    currency
    appliedPricingUnitCode
    billingTiming
    displayOnInvoice
    regroupPaidFees
    proration
    walletTargetable
    attachedToPlanOrSubscription
    attachedToSubscriptions
    product {
      id
      name
      code
      productType
      billableMetric {
        id
        name
        code
        aggregationType
        recurring
      }
    }
    productFilter {
      id
      name
      code
    }
  }

  mutation createRateCard($input: CreateRateCardInput!) {
    createRateCard(input: $input) {
      id
      ...RateCardForDrawer
    }
  }

  mutation updateRateCard($input: UpdateRateCardInput!) {
    updateRateCard(input: $input) {
      id
      ...RateCardForDrawer
    }
  }
`

// The create title doubles as the create submit label (identical copy).
export const RATE_CARD_DRAWER_TITLE_CREATE_KEY = 'text_1784925227817k72h5sd0wyu'
export const RATE_CARD_DRAWER_TITLE_EDIT_KEY = 'text_17849252278173fdc5gny30g'
export const RATE_CARD_DRAWER_SUBMIT_EDIT_KEY = 'text_1784925227817q9ktcnhk8ck'
export const RATE_CARD_CREATE_SUCCESS_TOAST_KEY = 'text_1784925227817geoh2i2loox'
export const RATE_CARD_CREATE_LINKED_TOAST_KEY = 'text_1784925227817uq7xpkcz688'
export const RATE_CARD_EDIT_SUCCESS_TOAST_KEY = 'text_1784925227818m11icvalbln'

const mapRateCardToFormValues = (rateCard: RateCardForDrawerFragment): RateCardFormValues => ({
  name: rateCard.name,
  code: rateCard.code,
  description: rateCard.description || '',
  productId: rateCard.product.id,
  productFilterId: rateCard.productFilter?.id || '',
  pricingUnit: rateCard.appliedPricingUnitCode ?? PRICING_UNIT_CURRENCY_OPTION,
  currency: rateCard.currency ?? '',
  billingTiming: rateCard.billingTiming,
  invoicingStrategy: mapInvoiceFieldsToStrategy({
    displayOnInvoice: rateCard.displayOnInvoice,
    regroupPaidFees: rateCard.regroupPaidFees,
  }),
  proration: rateCard.proration,
  walletTargetable: rateCard.walletTargetable ?? false,
})

type ProductAttachment = { id: string; name: string }
type ProductFilterAttachment = {
  id: string
  name: string
  product: { id: string; name: string }
}

type RateCardFormSuccess = {
  rateCard: RateCardForDrawerFragment
  wasEdit: boolean
}

const useRateCardForm = ({ onSuccess }: { onSuccess: (result: RateCardFormSuccess) => void }) => {
  const editedRateCardRef = useRef<RateCardForDrawerFragment | undefined>(undefined)

  const [createRateCard] = useCreateRateCardMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    // Refetched only if that query is currently active (mounted): the standalone
    // list and the product-item / product-item-filter details preview lists.
    refetchQueries: [
      'rateCards',
      'getRateCardsForProductDetails',
      'getRateCardsForProductFilterDetails',
    ],
  })
  const [updateRateCard] = useUpdateRateCardMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
  })

  const form = useAppForm({
    defaultValues: RATE_CARD_FORM_DEFAULTS,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: rateCardDrawerSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const editedRateCard = editedRateCardRef.current

      // Pay-in-advance carries the invoicing strategy; arrears is always
      // invoiceable so the invoice fields collapse to their default.
      const invoiceFields =
        value.billingTiming === RateCardBillingTimingEnum.Advance
          ? mapStrategyToInvoiceFields(value.invoicingStrategy)
          : { displayOnInvoice: true, regroupPaidFees: null }

      let rateCard: RateCardForDrawerFragment | null | undefined
      let errors: FetchResult['errors']

      // Update serializes cleared optional fields to null (undefined would be
      // stripped and the previous value would never clear); code, product item
      // and product item filter are create-only, so they are not sent on update.
      if (editedRateCard) {
        const result = await updateRateCard({
          variables: {
            input: {
              id: editedRateCard.id,
              name: value.name,
              description: value.description || null,
              billingTiming: value.billingTiming,
              proration: value.proration,
              walletTargetable: value.walletTargetable,
              ...buildPricingInput(value),
              ...invoiceFields,
            },
          },
        })

        rateCard = result.data?.updateRateCard
        errors = result.errors
      } else {
        const result = await createRateCard({
          variables: {
            input: {
              name: value.name,
              code: value.code,
              productId: value.productId,
              ...(value.productFilterId ? { productFilterId: value.productFilterId } : {}),
              ...(value.description ? { description: value.description } : {}),
              billingTiming: value.billingTiming,
              proration: value.proration,
              walletTargetable: value.walletTargetable,
              ...buildPricingInput(value),
              ...invoiceFields,
            },
          },
        })

        rateCard = result.data?.createRateCard
        errors = result.errors
      }

      // Backend rejected a duplicate code: surface it under the Code input and
      // keep the drawer open.
      if (hasDefinedGQLError('ValueAlreadyExist', errors)) {
        applyExistingCodeError(formApi)
        return
      }

      if (rateCard) {
        onSuccess({ rateCard, wasEdit: !!editedRateCard })
      }
    },
  })

  const resetForm = (
    rateCard?: RateCardForDrawerFragment,
    attachToProduct?: ProductAttachment,
    attachToProductFilter?: ProductFilterAttachment,
  ) => {
    editedRateCardRef.current = rateCard

    if (rateCard) {
      form.reset(mapRateCardToFormValues(rateCard), { keepDefaultValues: true })
      return
    }

    const seededProductId = attachToProductFilter?.product.id ?? attachToProduct?.id ?? ''
    const seededProductFilterId = attachToProductFilter?.id ?? ''

    form.reset(
      {
        ...RATE_CARD_FORM_DEFAULTS,
        productId: seededProductId,
        productFilterId: seededProductFilterId,
      },
      { keepDefaultValues: true },
    )
  }

  return { form, resetForm }
}

type OpenRateCardDrawerArgs = {
  rateCard?: RateCardForDrawerFragment
  attachToProduct?: ProductAttachment
  attachToProductFilter?: ProductFilterAttachment
}

// Tri-mode drawer: `openDrawer()` creates a rate card, `openDrawer({ rateCard })`
// edits it, and `openDrawer({ attachToProduct })` / `({ attachToProductFilter })`
// (used from the details tabs) prefill the attachment. Create mode carries the
// "Create more" footer toggle that keeps the drawer open, resets the form
// (re-seeding the attachment), and links the new rate card in the toast.
export const useRateCardDrawer = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { organizationSlug } = useParams()
  const drawer = useFormDrawer()
  const { createMoreControl, isCreateMoreEnabled, resetCreateMore, resetSignal, notifyReset } =
    useCreateMore()

  // Remember the attachment for the whole drawer session so the "create more"
  // reset (fired from onSuccess, outside openDrawer's scope) can re-seed it
  // instead of clearing the selection.
  const attachToProductRef = useRef<ProductAttachment | undefined>(undefined)
  const attachToProductFilterRef = useRef<ProductFilterAttachment | undefined>(undefined)

  const { form, resetForm } = useRateCardForm({
    onSuccess: ({ rateCard, wasEdit }) => {
      if (wasEdit) {
        drawer.close()
        addToast({
          severity: 'success',
          message: translate(RATE_CARD_EDIT_SUCCESS_TOAST_KEY),
        })
        return
      }

      const rateCardDetailsPath = generatePath(RATE_CARD_DETAILS_ROUTE, {
        rateCardId: rateCard.id,
        tab: RateCardDetailsTabsOptionsEnum.overview,
      })

      if (isCreateMoreEnabled()) {
        // Re-seed the attachment (if any) so the next rate card stays scoped to
        // the same product item / filter instead of resetting to none.
        resetForm(undefined, attachToProductRef.current, attachToProductFilterRef.current)
        notifyReset()
        // The drawer renders outside the matched-route context, so the router
        // Link in the toast cannot auto-prepend the org slug; bake it in here.
        addToast({
          severity: 'success',
          message: translate(RATE_CARD_CREATE_LINKED_TOAST_KEY, {
            rateCardName: escapeDoubleQuotes(rateCard.name),
            rateCardUrl: prependOrgSlug(rateCardDetailsPath, organizationSlug),
          }),
        })
        return
      }

      drawer.close()
      navigate(rateCardDetailsPath)
      addToast({
        severity: 'success',
        message: translate(RATE_CARD_CREATE_SUCCESS_TOAST_KEY),
      })
    },
  })

  const openDrawer = ({
    rateCard,
    attachToProduct,
    attachToProductFilter,
  }: OpenRateCardDrawerArgs = {}) => {
    attachToProductRef.current = attachToProduct
    attachToProductFilterRef.current = attachToProductFilter
    resetCreateMore()
    resetForm(rateCard, attachToProduct, attachToProductFilter)

    const isEdit = !!rateCard
    // Attaching a rate card to a plan/subscription freezes everything except the
    // display fields (name / description).
    const isLocked = !!(rateCard?.attachedToPlanOrSubscription || rateCard?.attachedToSubscriptions)

    const productSource = rateCard?.product ?? attachToProductFilter?.product ?? attachToProduct
    const productSeed: RateCardProductSeed = productSource
      ? {
          value: productSource.id,
          label: productSource.name,
          // Only the edit fragment carries the metadata that drives the derived
          // sections; the attach args are label-only.
          ...(rateCard?.product
            ? {
                productType: rateCard.product.productType,
                aggregationType: rateCard.product.billableMetric?.aggregationType,
                recurring: rateCard.product.billableMetric?.recurring,
              }
            : {}),
        }
      : null

    const productFilterSource = rateCard?.productFilter ?? attachToProductFilter
    const productFilterSeed: RateCardComboboxSeed = productFilterSource
      ? { value: productFilterSource.id, label: productFilterSource.name }
      : null

    drawer.open({
      title: isEdit
        ? translate(RATE_CARD_DRAWER_TITLE_EDIT_KEY)
        : translate(RATE_CARD_DRAWER_TITLE_CREATE_KEY),
      form: { id: RATE_CARD_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      onEntered: focusFirstInput,
      shouldPromptOnClose: () => form.state.isDirty,
      secondaryAction: isEdit ? undefined : createMoreControl,
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest={RATE_CARD_FORM_SUBMIT_TEST_ID}>
            {translate(
              isEdit ? RATE_CARD_DRAWER_SUBMIT_EDIT_KEY : RATE_CARD_DRAWER_TITLE_CREATE_KEY,
            )}
          </form.SubmitButton>
        </form.AppForm>
      ),
      children: (
        <RateCardDrawerContent
          form={form}
          isEdit={isEdit}
          isLocked={isLocked}
          disableCodeInput={isLocked || isEdit}
          productSeed={productSeed}
          productFilterSeed={productFilterSeed}
          resetSignal={resetSignal}
        />
      ),
    })
  }

  return { openDrawer }
}
