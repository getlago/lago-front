import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { generatePath, useParams } from 'react-router'

import { CreateMoreResetBoundary } from '~/components/drawers/createMore/CreateMoreResetBoundary'
import { useCreateMore } from '~/components/drawers/createMore/useCreateMore'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast } from '~/core/apolloClient'
import { useNavigate } from '~/core/router'
import { CATALOG_PLAN_RATE_CARD_DETAILS_ROUTE } from '~/core/router/CatalogRoutes'
import { CONTRACT_RATE_CARD_DETAILS_ROUTE } from '~/core/router/ObjectsRoutes'
import { prependOrgSlug } from '~/core/router/utils/prependOrgSlug'
import { escapeDoubleQuotes } from '~/core/utils/escapeDoubleQuotes'
import {
  CurrencyEnum,
  useCreateContractAppliedRateCardMutation,
  useCreatePlanAppliedRateCardMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useRateCardDrawer } from '~/pages/catalog/drawers/rateCard/useRateCardDrawer'

import { AppliedRateCardDrawerContent } from './AppliedRateCardDrawerContent'
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

export type AppliedRateCardDrawerProps =
  | { context: 'plan'; planId: string; currency: CurrencyEnum }
  | { context: 'contract'; contractId: string; contractExternalId: string; currency: CurrencyEnum }

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
    refetchQueries: ['getPlanAppliedRateCardsForRateCardsSection', 'getCatalogPlanForDetails'],
  })
  const [createContractAppliedRateCard] = useCreateContractAppliedRateCardMutation({
    refetchQueries: ['getContractAppliedRateCardsForRateCardsSection', 'getContractForDetails'],
  })
  const currentProps = useRef<AppliedRateCardDrawerProps | null>(null)

  const form = useAppForm({
    defaultValues: APPLIED_RATE_CARD_FORM_DEFAULTS,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: buildAppliedRateCardFormSchema() },
    onSubmit: async ({ value }) => {
      const props = currentProps.current

      if (!props) return

      let created: { id: string; rateCard: { name: string } } | null | undefined

      const input = mapFromFormToApi(value, props.currency)

      if (props.context === 'plan') {
        const result = await createPlanAppliedRateCard({
          variables: { input: { planId: props.planId, ...input } },
        })

        created = result.data?.createPlanAppliedRateCard
      } else {
        const result = await createContractAppliedRateCard({
          variables: { input: { externalId: props.contractExternalId, ...input } },
        })

        created = result.data?.createContractAppliedRateCard
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
            currency={props.currency}
            openRateCardDrawer={openRateCardDrawer}
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
