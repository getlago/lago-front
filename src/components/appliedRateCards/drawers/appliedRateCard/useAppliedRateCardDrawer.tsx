import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { generatePath } from 'react-router'

import { CreateMoreResetBoundary } from '~/components/drawers/createMore/CreateMoreResetBoundary'
import { useCreateMore } from '~/components/drawers/createMore/useCreateMore'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { addToast } from '~/core/apolloClient'
import { useNavigate } from '~/core/router'
import { CATALOG_PLAN_RATE_CARD_DETAILS_ROUTE } from '~/core/router/CatalogRoutes'
import { CONTRACT_RATE_CARD_DETAILS_ROUTE } from '~/core/router/ObjectsRoutes'
import {
  useCreateContractAppliedRateCardMutation,
  useCreatePlanAppliedRateCardMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import { AppliedRateCardDrawerContent } from './AppliedRateCardDrawerContent'
import {
  APPLIED_RATE_CARD_FORM_DEFAULTS,
  buildAppliedRateCardFormSchema,
  buildCreateContractAppliedRateCardInput,
  buildCreatePlanAppliedRateCardInput,
} from './validationSchema'

gql`
  mutation createPlanAppliedRateCard($input: CreatePlanAppliedRateCardInput!) {
    createPlanAppliedRateCard(input: $input) {
      id
    }
  }

  mutation createContractAppliedRateCard($input: CreateContractAppliedRateCardInput!) {
    createContractAppliedRateCard(input: $input) {
      id
    }
  }
`

const APPLIED_RATE_CARD_FORM_ID = 'applied-rate-card-drawer-form'

export type AppliedRateCardDrawerProps =
  { context: 'plan'; planId: string } | { context: 'contract'; contractId: string }

export const useAppliedRateCardDrawer = (): {
  openDrawer: (props: AppliedRateCardDrawerProps) => void
} => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const drawer = useFormDrawer()
  const { createMoreControl, isCreateMoreEnabled, resetCreateMore, resetSignal, notifyReset } =
    useCreateMore()
  const [createPlanAppliedRateCard] = useCreatePlanAppliedRateCardMutation()
  const [createContractAppliedRateCard] = useCreateContractAppliedRateCardMutation()
  const currentProps = useRef<AppliedRateCardDrawerProps | null>(null)

  const form = useAppForm({
    defaultValues: APPLIED_RATE_CARD_FORM_DEFAULTS,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: buildAppliedRateCardFormSchema() },
    onSubmit: async ({ value }) => {
      const props = currentProps.current

      if (!props) return

      let createdId: string | null | undefined

      if (props.context === 'plan') {
        const result = await createPlanAppliedRateCard({
          variables: { input: buildCreatePlanAppliedRateCardInput(value, props.planId) },
        })

        createdId = result.data?.createPlanAppliedRateCard?.id
      } else {
        const result = await createContractAppliedRateCard({
          variables: { input: buildCreateContractAppliedRateCardInput(value, props.contractId) },
        })

        createdId = result.data?.createContractAppliedRateCard?.id
      }

      if (!createdId) return

      const path =
        props.context === 'plan'
          ? generatePath(CATALOG_PLAN_RATE_CARD_DETAILS_ROUTE, {
              catalogPlanId: props.planId,
              appliedRateCardId: createdId,
            })
          : generatePath(CONTRACT_RATE_CARD_DETAILS_ROUTE, {
              id: props.contractId,
              appliedRateCardId: createdId,
            })

      if (isCreateMoreEnabled()) {
        form.reset(APPLIED_RATE_CARD_FORM_DEFAULTS)
        notifyReset()
        addToast({
          severity: 'success',
          message: translate('text_1791485670326zpgh4ogfe6t', { rateCardUrl: path }),
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
      title: translate('text_1789030049529b0zmy1slfxl'),
      form: { id: APPLIED_RATE_CARD_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      shouldPromptOnClose: () => form.state.isDirty,
      onClose: () => form.reset(),
      secondaryAction: createMoreControl,
      children: (
        <CreateMoreResetBoundary resetSignal={resetSignal}>
          <AppliedRateCardDrawerContent form={form} context={props.context} />
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
