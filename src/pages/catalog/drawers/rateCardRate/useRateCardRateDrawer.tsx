import { FetchResult, gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { DateTime } from 'luxon'
import { useRef } from 'react'
import { generatePath, useParams } from 'react-router-dom'

import { useCreateMore } from '~/components/drawers/createMore/useCreateMore'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { RateCardRateDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { applyExistingCodeError } from '~/core/form/existingCodeError'
import { RATE_CARD_RATE_DETAILS_ROUTE, useNavigate } from '~/core/router'
import { prependOrgSlug } from '~/core/router/utils/prependOrgSlug'
import getPropertyShape from '~/core/serializers/getPropertyShape'
import { deserializeAmount, serializeAmount } from '~/core/serializers/serializeAmount'
import { serializeProperties } from '~/core/serializers/serializePlanInput'
import { escapeDoubleQuotes } from '~/core/utils/escapeDoubleQuotes'
import {
  ChargeModelEnum,
  CustomChargeFragmentDoc,
  GraduatedChargeFragmentDoc,
  GraduatedPercentageChargeFragmentDoc,
  LagoApiError,
  PackageChargeFragmentDoc,
  PercentageChargeFragmentDoc,
  PricingGroupKeysFragmentDoc,
  Properties,
  PropertiesInput,
  RateCardBillingTimingEnum,
  RateCardForRateDrawerFragment,
  RateCardRateForDrawerFragment,
  RateCardRateStatusEnum,
  StandardChargeFragmentDoc,
  UpdateRateCardRateInput,
  useCreateRateCardRateMutation,
  useUpdateRateCardRateMutation,
  VolumeRangesFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useCustomPricingUnits } from '~/hooks/plans/useCustomPricingUnits'

import {
  buildRateCardRateSchema,
  RATE_CARD_RATE_DRAWER_TITLE_CREATE_KEY,
  RATE_CARD_RATE_DRAWER_TITLE_EDIT_KEY,
  RATE_CARD_RATE_DUPLICATE_DATE_KEY,
  RATE_CARD_RATE_FORM_DEFAULTS,
  RATE_CARD_RATE_FORM_ID,
  RATE_CARD_RATE_FORM_SUBMIT_TEST_ID,
  RATE_CARD_RATE_SAVE_FAILED_KEY,
  RateCardRateFormValues,
  RateCardRateSchemaContext,
} from './constants'
import { RateCardRateDrawerContent } from './RateCardRateDrawerContent'

gql`
  fragment PropertiesForRateCardRate on Properties {
    ...StandardCharge
    ...PackageCharge
    ...PercentageCharge
    ...CustomCharge
    ...PricingGroupKeys
    graduatedRanges {
      ...GraduatedCharge
    }
    graduatedPercentageRanges {
      ...GraduatedPercentageCharge
    }
    volumeRanges {
      ...VolumeRanges
    }
  }

  fragment RateCardRateForDrawer on RateCardRate {
    id
    code
    effectiveFrom
    status
    rateModel
    billingIntervalCount
    billingIntervalUnit
    minAmountCents
    appliedPricingUnitConversionRate
    rateProperties {
      ...PropertiesForRateCardRate
    }
  }

  fragment RateCardForRateDrawer on RateCard {
    id
    currency
    appliedPricingUnitCode
    billingTiming
    attachedToPlanOrSubscription
    attachedToSubscriptions
    product {
      id
      productType
      billableMetric {
        id
        aggregationType
      }
    }
    activeRate {
      id
      effectiveFrom
    }
  }

  mutation createRateCardRate($input: CreateRateCardRateInput!) {
    createRateCardRate(input: $input) {
      id
      ...RateCardRateForDrawer
    }
  }

  mutation updateRateCardRate($input: UpdateRateCardRateInput!) {
    updateRateCardRate(input: $input) {
      id
      ...RateCardRateForDrawer
    }
  }

  ${StandardChargeFragmentDoc}
  ${PackageChargeFragmentDoc}
  ${PercentageChargeFragmentDoc}
  ${CustomChargeFragmentDoc}
  ${PricingGroupKeysFragmentDoc}
  ${GraduatedChargeFragmentDoc}
  ${GraduatedPercentageChargeFragmentDoc}
  ${VolumeRangesFragmentDoc}
`

// New translation keys are exported as named constants (feature convention) so tests and
// siblings reference them instead of duplicating the raw ids.
export const RATE_CARD_RATE_DRAWER_SUBMIT_CREATE_KEY = 'text_178773722022763shda9obv8'
export const RATE_CARD_RATE_CREATE_SUCCESS_TOAST_KEY = 'text_1787737220228xp4gsk6phtq'
export const RATE_CARD_RATE_CREATE_LINKED_TOAST_KEY = 'text_1787737220228ohglc5h59fp'
export const RATE_CARD_RATE_EDIT_SUCCESS_TOAST_KEY = 'text_1787737220228s9wmwhscsfg'

// Range rows come back from the API carrying `__typename`, which the typed PropertiesInput
// rejects on the way back in - rebuild them from the fields the form owns.
const toFormProperties = (rateProperties: RateCardRateForDrawerFragment['rateProperties']) => {
  const shape = getPropertyShape(rateProperties as Properties)

  return {
    ...shape,
    graduatedRanges: rateProperties.graduatedRanges?.map(
      ({ fromValue, toValue, flatAmount, perUnitAmount }) => ({
        fromValue,
        toValue,
        flatAmount,
        perUnitAmount,
      }),
    ),
    graduatedPercentageRanges: rateProperties.graduatedPercentageRanges?.map(
      ({ fromValue, toValue, flatAmount, rate }) => ({ fromValue, toValue, flatAmount, rate }),
    ),
    volumeRanges: rateProperties.volumeRanges?.map(
      ({ fromValue, toValue, flatAmount, perUnitAmount }) => ({
        fromValue,
        toValue,
        flatAmount,
        perUnitAmount,
      }),
    ),
  }
}

const mapRateToFormValues = (
  rate: RateCardRateForDrawerFragment,
  currency: RateCardForRateDrawerFragment['currency'],
): RateCardRateFormValues => ({
  effectiveFrom: rate.effectiveFrom,
  code: rate.code,
  billingIntervalCount: String(rate.billingIntervalCount),
  billingIntervalUnit: rate.billingIntervalUnit,
  conversionRate:
    rate.appliedPricingUnitConversionRate === null ||
    rate.appliedPricingUnitConversionRate === undefined
      ? ''
      : String(rate.appliedPricingUnitConversionRate),
  rateModel: rate.rateModel,
  properties: toFormProperties(rate.rateProperties),
  // Stored in the currency's smallest unit; the form edits a decimal amount.
  minAmountCents: Number(rate.minAmountCents)
    ? String(deserializeAmount(rate.minAmountCents, currency))
    : '',
})

/**
 * The rate a new date must land after - the card's currently effective rate, EXCEPT when that
 * is the very rate being edited: comparing it against itself would make its own date invalid
 * and block every save. Mirrors `validate_effective_from_is_appended`, which excludes self.
 */
const deriveEffectiveFromBoundary = (
  rateCard: RateCardForRateDrawerFragment,
  rate?: RateCardRateForDrawerFragment,
): string | null => {
  const activeRate = rateCard.activeRate

  if (!activeRate || activeRate.id === rate?.id) return null

  return activeRate.effectiveFrom
}

type RateCardRateFormSuccess = {
  rate: RateCardRateForDrawerFragment
  wasEdit: boolean
}

const useRateCardRateForm = ({
  onSuccess,
}: {
  onSuccess: (result: RateCardRateFormSuccess) => void
}) => {
  const editedRateRef = useRef<RateCardRateForDrawerFragment | undefined>(undefined)
  const rateCardRef = useRef<RateCardForRateDrawerFragment | undefined>(undefined)
  const schemaContextRef = useRef<RateCardRateSchemaContext>({
    requiresConversionRate: false,
    effectiveFromBoundary: null,
  })

  const [createRateCardRate] = useCreateRateCardRateMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    // Refetched only if currently mounted: the card's rates tab, plus every surface showing
    // the card's `activeRate` / `ratesCount`.
    refetchQueries: [
      'rateCardRates',
      'getRateCardForDetails',
      'rateCards',
      'getRateCardsForProductDetails',
      'getRateCardsForProductFilterDetails',
    ],
  })
  const [updateRateCardRate] = useUpdateRateCardRateMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    refetchQueries: [
      'rateCardRates',
      'getRateCardForDetails',
      'rateCards',
      'getRateCardsForProductDetails',
      'getRateCardsForProductFilterDetails',
    ],
  })

  const form = useAppForm({
    defaultValues: RATE_CARD_RATE_FORM_DEFAULTS,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: buildRateCardRateSchema(() => schemaContextRef.current),
    },
    onSubmit: async ({ value, formApi }) => {
      const rateCard = rateCardRef.current
      const editedRate = editedRateRef.current

      if (!rateCard) return

      const rateProperties = serializeProperties(
        (value.properties ?? {}) as Properties,
        // The two enums are distinct GraphQL types with identical string members, and the
        // charge serializer keys off those strings.
        value.rateModel as unknown as ChargeModelEnum,
      ) as PropertiesInput

      const conversionRate = rateCard.appliedPricingUnitCode
        ? { appliedPricingUnitConversionRate: Number(value.conversionRate) }
        : {}

      const minAmountCents = Number(serializeAmount(value.minAmountCents || 0, rateCard.currency))
      const supportsSpendingMinimum = rateCard.billingTiming === RateCardBillingTimingEnum.Arrears

      let rate: RateCardRateForDrawerFragment | null | undefined
      let errors: FetchResult['errors']

      if (editedRate) {
        // An active rate freezes its timeline and model server-side, and rejects them on
        // presence even when unchanged (`FROZEN_ON_ACTIVE`), so they are omitted entirely.
        const isActiveRate = editedRate.status === RateCardRateStatusEnum.Active
        const input: UpdateRateCardRateInput = {
          id: editedRate.id,
          rateProperties,
          ...conversionRate,
          ...(isActiveRate
            ? {}
            : {
                code: value.code,
                effectiveFrom: value.effectiveFrom,
                rateModel: value.rateModel,
                billingIntervalCount: Number(value.billingIntervalCount),
                billingIntervalUnit: value.billingIntervalUnit,
                ...(supportsSpendingMinimum ? { minAmountCents } : {}),
              }),
        }

        const result = await updateRateCardRate({ variables: { input } })

        rate = result.data?.updateRateCardRate
        errors = result.errors
      } else {
        const result = await createRateCardRate({
          variables: {
            input: {
              rateCardId: rateCard.id,
              code: value.code,
              effectiveFrom: value.effectiveFrom,
              rateModel: value.rateModel,
              rateProperties,
              billingIntervalCount: Number(value.billingIntervalCount),
              billingIntervalUnit: value.billingIntervalUnit,
              ...conversionRate,
              ...(supportsSpendingMinimum && minAmountCents ? { minAmountCents } : {}),
            },
          },
        })

        rate = result.data?.createRateCardRate
        errors = result.errors
      }

      // Both the code and the effective date are unique per card, so the backend answers a
      // collision on either with the same error code - scope it to the field it came from,
      // otherwise a duplicate date reads as a duplicate code.
      if (hasDefinedGQLError('ValueAlreadyExist', errors, 'code')) {
        applyExistingCodeError(formApi)
        return
      }

      if (hasDefinedGQLError('ValueAlreadyExist', errors, 'effectiveFrom')) {
        formApi.setFieldMeta('effectiveFrom', (meta) => ({
          ...meta,
          errorMap: {
            ...meta?.errorMap,
            onDynamic: { message: RATE_CARD_RATE_DUPLICATE_DATE_KEY },
          },
        }))
        return
      }

      // Anything else the backend refuses (an incompatible rate model, a spending minimum on a
      // pay-in-advance card, a frozen field) is silenced by `silentErrorCodes`, so without this
      // the submit would look like a no-op.
      if (errors?.length) {
        addToast({ severity: 'danger', translateKey: RATE_CARD_RATE_SAVE_FAILED_KEY })
        return
      }

      if (rate) {
        onSuccess({ rate, wasEdit: !!editedRate })
      }
    },
  })

  const resetForm = (
    rateCard: RateCardForRateDrawerFragment,
    rate?: RateCardRateForDrawerFragment,
  ) => {
    rateCardRef.current = rateCard
    editedRateRef.current = rate
    schemaContextRef.current = {
      requiresConversionRate: !!rateCard.appliedPricingUnitCode,
      effectiveFromBoundary: deriveEffectiveFromBoundary(rateCard, rate),
    }

    form.reset(rate ? mapRateToFormValues(rate, rateCard.currency) : RATE_CARD_RATE_FORM_DEFAULTS, {
      keepDefaultValues: true,
    })
  }

  return {
    form,
    resetForm,
    getEffectiveFromBoundary: () => schemaContextRef.current.effectiveFromBoundary,
    advanceEffectiveFromBoundary: (effectiveFrom: string) => {
      schemaContextRef.current = {
        ...schemaContextRef.current,
        effectiveFromBoundary: effectiveFrom,
      }
    },
  }
}

type OpenRateCardRateDrawerArgs = {
  rateCard: RateCardForRateDrawerFragment
  rate?: RateCardRateForDrawerFragment
}

// Dual-mode drawer: `openDrawer({ rateCard })` appends a rate to the card,
// `openDrawer({ rateCard, rate })` edits it. Create mode carries the "Create more" footer
// toggle that keeps the drawer open, resets the form and links the new rate in the toast.
export const useRateCardRateDrawer = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { organizationSlug } = useParams()
  const drawer = useFormDrawer()
  const { pricingUnits } = useCustomPricingUnits()
  const { createMoreControl, isCreateMoreEnabled, resetCreateMore, resetSignal, notifyReset } =
    useCreateMore()

  // Remembered for the whole drawer session so the "create more" reset (fired from
  // onSuccess, outside openDrawer's scope) can re-seed from the same card.
  const rateCardRef = useRef<RateCardForRateDrawerFragment | undefined>(undefined)

  const { form, resetForm, advanceEffectiveFromBoundary, getEffectiveFromBoundary } =
    useRateCardRateForm({
      onSuccess: ({ rate, wasEdit }) => {
        if (wasEdit) {
          drawer.close()
          addToast({
            severity: 'success',
            message: translate(RATE_CARD_RATE_EDIT_SUCCESS_TOAST_KEY),
          })
          return
        }

        const rateCard = rateCardRef.current

        const rateDetailsPath = generatePath(RATE_CARD_RATE_DETAILS_ROUTE, {
          rateCardId: rateCard?.id as string,
          rateId: rate.id,
          tab: RateCardRateDetailsTabsOptionsEnum.overview,
        })

        if (isCreateMoreEnabled() && rateCard) {
          resetForm(rateCard)

          // After the reset, which re-derives the boundary from the card as it was when the
          // drawer opened: only a rate that is already effective becomes the card's active
          // rate, and only that moves the boundary
          // (`others.where(effective_from: ..now).maximum`).
          if (DateTime.fromISO(rate.effectiveFrom) <= DateTime.utc()) {
            advanceEffectiveFromBoundary(rate.effectiveFrom)
          }

          notifyReset()
          // The drawer renders outside the matched-route context, so the router Link in the
          // toast cannot auto-prepend the org slug; bake it in here.
          addToast({
            severity: 'success',
            message: translate(RATE_CARD_RATE_CREATE_LINKED_TOAST_KEY, {
              rateCode: escapeDoubleQuotes(rate.code),
              rateUrl: prependOrgSlug(rateDetailsPath, organizationSlug),
            }),
          })
          return
        }

        drawer.close()
        navigate(rateDetailsPath)
        addToast({
          severity: 'success',
          message: translate(RATE_CARD_RATE_CREATE_SUCCESS_TOAST_KEY),
        })
      },
    })

  const openDrawer = ({ rateCard, rate }: OpenRateCardRateDrawerArgs) => {
    rateCardRef.current = rateCard
    resetCreateMore()
    resetForm(rateCard, rate)

    const isEdit = !!rate
    const isActiveRate = rate?.status === RateCardRateStatusEnum.Active

    const pricingUnitShortName = pricingUnits.find(
      (unit) => unit.code === rateCard.appliedPricingUnitCode,
    )?.shortName

    drawer.open({
      title: isEdit
        ? translate(RATE_CARD_RATE_DRAWER_TITLE_EDIT_KEY)
        : translate(RATE_CARD_RATE_DRAWER_TITLE_CREATE_KEY),
      form: { id: RATE_CARD_RATE_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      onEntered: focusFirstInput,
      shouldPromptOnClose: () => form.state.isDirty,
      secondaryAction: isEdit ? undefined : createMoreControl,
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest={RATE_CARD_RATE_FORM_SUBMIT_TEST_ID}>
            {translate(
              isEdit ? 'text_17295436903260tlyb1gp1i7' : RATE_CARD_RATE_DRAWER_SUBMIT_CREATE_KEY,
            )}
          </form.SubmitButton>
        </form.AppForm>
      ),
      children: (
        <RateCardRateDrawerContent
          form={form}
          rateCard={{
            currency: rateCard.currency,
            appliedPricingUnitCode: rateCard.appliedPricingUnitCode,
            billingTiming: rateCard.billingTiming,
            productType: rateCard.product.productType,
            aggregationType: rateCard.product.billableMetric?.aggregationType,
          }}
          isEdit={isEdit}
          isActiveRate={isActiveRate}
          isCodeLocked={isEdit && rateCard.attachedToPlanOrSubscription}
          getEffectiveFromBoundary={getEffectiveFromBoundary}
          initialMinAmountCents={
            rate && Number(rate.minAmountCents)
              ? String(deserializeAmount(rate.minAmountCents, rateCard.currency))
              : ''
          }
          pricingUnitShortName={pricingUnitShortName}
          resetSignal={resetSignal}
        />
      ),
    })
  }

  return { openDrawer }
}
