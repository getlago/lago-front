import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { GraphQLFormattedError } from 'graphql'
import { useRef } from 'react'
import { generatePath, useParams } from 'react-router'

import {
  APPLIED_RATE_CARD_CONTEXT_CONFIG,
  PRICED_SLICES_REFETCH_QUERIES,
} from '~/components/appliedRateCards/appliedRateCardContextConfig'
import { CreateMoreResetBoundary } from '~/components/drawers/createMore/CreateMoreResetBoundary'
import { useCreateMore } from '~/components/drawers/createMore/useCreateMore'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { useNavigate } from '~/core/router'
import { CATALOG_PLAN_RATE_CARD_DETAILS_ROUTE } from '~/core/router/CatalogRoutes'
import { CONTRACT_RATE_CARD_DETAILS_ROUTE } from '~/core/router/ObjectsRoutes'
import { prependOrgSlug } from '~/core/router/utils/prependOrgSlug'
import { escapeDoubleQuotes } from '~/core/utils/escapeDoubleQuotes'
import {
  CurrencyEnum,
  LagoApiError,
  useCreateContractAppliedRateCardMutation,
  useCreatePlanAppliedRateCardMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useRateCardDrawer } from '~/pages/catalog/drawers/rateCard/useRateCardDrawer'

import { AppliedRateCardDrawerContent } from './AppliedRateCardDrawerContent'
import { AppliedRateCardParent } from './usePricedProductFilterIds'
import {
  APPLIED_RATE_CARD_FORM_DEFAULTS,
  buildAppliedRateCardFormSchema,
  mapFromFormToApi,
} from './validationSchema'

gql`
  mutation createPlanAppliedRateCard($input: CreatePlanAppliedRateCardInput!) {
    createPlanAppliedRateCard(input: $input) {
      id
      rateCard {
        id
        name
      }
    }
  }

  mutation createContractAppliedRateCard($input: CreateContractAppliedRateCardInput!) {
    createContractAppliedRateCard(input: $input) {
      id
      rateCard {
        id
        name
      }
    }
  }
`

const APPLIED_RATE_CARD_FORM_ID = 'applied-rate-card-drawer-form'

const ALREADY_PRICED_ERRORS = [
  LagoApiError.ProductAlreadyPriced,
  LagoApiError.ProductFilterAlreadyPriced,
]

export type AppliedRateCardDrawerProps =
  | { context: 'plan'; planId: string; currency: CurrencyEnum }
  | { context: 'contract'; contractId: string; contractExternalId: string; currency: CurrencyEnum }

const toParent = (props: AppliedRateCardDrawerProps): AppliedRateCardParent =>
  props.context === 'plan'
    ? { context: 'plan', planId: props.planId }
    : { context: 'contract', contractId: props.contractId }

export const useAppliedRateCardDrawer = (): {
  openDrawer: (props: AppliedRateCardDrawerProps) => void
} => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { organizationSlug } = useParams()
  const drawer = useFormDrawer()
  const { openDrawer: openRateCardDrawer } = useRateCardDrawer()
  const { createMoreControl, isCreateMoreEnabled, resetCreateMore, resetSignal, notifyReset } =
    useCreateMore()
  // The rate cards list and the details header count; create-more never navigates to refresh them.
  const [createPlanAppliedRateCard] = useCreatePlanAppliedRateCardMutation({
    refetchQueries: [
      'getPlanAppliedRateCardsForRateCardsSection',
      'getCatalogPlanForDetails',
      ...PRICED_SLICES_REFETCH_QUERIES.plan,
    ],
    context: { silentErrorDetails: ALREADY_PRICED_ERRORS },
  })
  const [createContractAppliedRateCard] = useCreateContractAppliedRateCardMutation({
    refetchQueries: [
      'getContractAppliedRateCardsForRateCardsSection',
      'getContractForDetails',
      ...PRICED_SLICES_REFETCH_QUERIES.contract,
    ],
    context: { silentErrorDetails: ALREADY_PRICED_ERRORS },
  })
  const currentProps = useRef<AppliedRateCardDrawerProps | null>(null)

  const form = useAppForm({
    defaultValues: APPLIED_RATE_CARD_FORM_DEFAULTS,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: buildAppliedRateCardFormSchema() },
    onSubmitInvalid: ({ formApi }) => {
      scrollToFirstInputError(APPLIED_RATE_CARD_FORM_ID, formApi.state.errorMap.onDynamic || {})
    },
    onSubmit: async ({ value, formApi }) => {
      const props = currentProps.current

      if (!props) return

      let created: { id: string; rateCard: { name: string } } | null | undefined
      let errors: readonly GraphQLFormattedError[] | undefined

      const input = mapFromFormToApi(value, props.currency)

      if (props.context === 'plan') {
        const result = await createPlanAppliedRateCard({
          variables: { input: { planId: props.planId, ...input } },
        })

        created = result.data?.createPlanAppliedRateCard
        errors = result.errors
      } else {
        const result = await createContractAppliedRateCard({
          variables: { input: { externalId: props.contractExternalId, ...input } },
        })

        created = result.data?.createContractAppliedRateCard
        errors = result.errors
      }

      // Another session can price the slice between the drawer's lookup and this save.
      if (
        hasDefinedGQLError('ProductAlreadyPriced', errors, 'rateCard') ||
        hasDefinedGQLError('ProductFilterAlreadyPriced', errors, 'rateCard')
      ) {
        const fields = {
          rateCardId: {
            message: APPLIED_RATE_CARD_CONTEXT_CONFIG[props.context].alreadyPricedTranslationKey,
            path: ['rateCardId'],
          },
        }

        formApi.setErrorMap({ onDynamic: { fields } })
        scrollToFirstInputError(APPLIED_RATE_CARD_FORM_ID, fields)
        return
      }

      if (!created) return

      const path =
        props.context === 'plan'
          ? generatePath(CATALOG_PLAN_RATE_CARD_DETAILS_ROUTE, {
              catalogPlanId: props.planId,
              appliedRateCardId: created.id,
            })
          : generatePath(CONTRACT_RATE_CARD_DETAILS_ROUTE, {
              id: props.contractId,
              appliedRateCardId: created.id,
            })

      if (isCreateMoreEnabled()) {
        form.reset(APPLIED_RATE_CARD_FORM_DEFAULTS)
        notifyReset()
        addToast({
          severity: 'success',
          message: translate('text_1791485670326zpgh4ogfe6t', {
            rateCardName: escapeDoubleQuotes(created.rateCard.name),
            rateCardUrl: prependOrgSlug(path, organizationSlug),
          }),
        })
        return
      }

      drawer.close()
      navigate(path)
      addToast({ severity: 'success', message: translate('text_1791485670327tovqupaf61o') })
    },
  })

  const openDrawer = (props: AppliedRateCardDrawerProps): void => {
    currentProps.current = props
    resetCreateMore()
    form.reset(APPLIED_RATE_CARD_FORM_DEFAULTS)

    void drawer.open({
      title: translate('text_1791833366840i00h4qnyjbw'),
      form: { id: APPLIED_RATE_CARD_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      onEntered: focusFirstInput,
      shouldPromptOnClose: () => form.state.isDirty,
      onClose: () => form.reset(),
      secondaryAction: createMoreControl,
      children: (
        <CreateMoreResetBoundary resetSignal={resetSignal}>
          <AppliedRateCardDrawerContent
            form={form}
            parent={toParent(props)}
            currency={props.currency}
            openRateCardDrawer={openRateCardDrawer}
            organizationSlug={organizationSlug}
          />
        </CreateMoreResetBoundary>
      ),
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest="applied-rate-card-drawer-save">
            {translate('text_1789030049529b0zmy1slfxl')}
          </form.SubmitButton>
        </form.AppForm>
      ),
    })
  }

  return { openDrawer }
}
