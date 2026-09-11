import { FetchResult, gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { generatePath, useParams } from 'react-router'

import { useCreateMore } from '~/components/drawers/createMore/useCreateMore'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { CatalogPlanDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { applyExistingCodeError } from '~/core/form/existingCodeError'
import { CATALOG_PLAN_DETAILS_ROUTE, useNavigate } from '~/core/router'
import { prependOrgSlug } from '~/core/router/utils/prependOrgSlug'
import { escapeDoubleQuotes } from '~/core/utils/escapeDoubleQuotes'
import {
  CatalogPlanForCatalogPlanDrawerFragment,
  CurrencyEnum,
  LagoApiError,
  useCreateCatalogPlanMutation,
  useUpdateCatalogPlanMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { CatalogPlanDrawerContent } from './CatalogPlanDrawerContent'
import {
  CATALOG_PLAN_DRAWER_TITLE_CREATE_KEY,
  CATALOG_PLAN_DRAWER_TITLE_EDIT_KEY,
  CATALOG_PLAN_FORM_DEFAULTS,
  CATALOG_PLAN_FORM_ID,
  CatalogPlanFormValues,
} from './constants'
import { catalogPlanSchema } from './schema'

gql`
  fragment CatalogPlanForCatalogPlanDrawer on CatalogPlan {
    id
    name
    code
    currency
    description
    invoiceDisplayName
    appliedRateCardsCount
    attachedToContracts
  }

  mutation createCatalogPlan($input: CreateCatalogPlanInput!) {
    createCatalogPlan(input: $input) {
      id
      ...CatalogPlanForCatalogPlanDrawer
    }
  }

  mutation updateCatalogPlan($input: UpdateCatalogPlanInput!) {
    updateCatalogPlan(input: $input) {
      id
      ...CatalogPlanForCatalogPlanDrawer
    }
  }
`

const mapCatalogPlanToFormValues = (
  catalogPlan: CatalogPlanForCatalogPlanDrawerFragment,
): CatalogPlanFormValues => ({
  name: catalogPlan.name,
  code: catalogPlan.code,
  currency: catalogPlan.currency,
  description: catalogPlan.description || '',
  invoiceDisplayName: catalogPlan.invoiceDisplayName || '',
})

type CatalogPlanFormSuccess = {
  catalogPlan: CatalogPlanForCatalogPlanDrawerFragment
  wasEdit: boolean
}

const useCatalogPlanForm = ({
  onSuccess,
}: {
  onSuccess: (result: CatalogPlanFormSuccess) => void
}) => {
  const { translate } = useInternationalization()
  const editedCatalogPlanRef = useRef<CatalogPlanForCatalogPlanDrawerFragment | undefined>(
    undefined,
  )

  const [createCatalogPlan] = useCreateCatalogPlanMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    refetchQueries: ['catalogPlans'],
  })
  const [updateCatalogPlan] = useUpdateCatalogPlanMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
  })

  const form = useAppForm({
    defaultValues: CATALOG_PLAN_FORM_DEFAULTS,
    validationLogic: revalidateLogic(),
    validators: { onDynamic: catalogPlanSchema },
    onSubmit: async ({ value, formApi }) => {
      const editedCatalogPlan = editedCatalogPlanRef.current

      let catalogPlan: CatalogPlanForCatalogPlanDrawerFragment | null | undefined
      let errors: FetchResult['errors']

      // Update sends cleared optionals as null (undefined is stripped, so the old
      // value would never clear); create omits them instead.
      if (editedCatalogPlan) {
        const result = await updateCatalogPlan({
          variables: {
            input: {
              id: editedCatalogPlan.id,
              name: value.name,
              // code/currency travel unchanged too: the backend's locks are
              // change-gated and only reject when the value actually differs.
              code: value.code,
              currency: value.currency as CurrencyEnum,
              description: value.description || null,
              invoiceDisplayName: value.invoiceDisplayName || null,
            },
          },
        })

        catalogPlan = result.data?.updateCatalogPlan
        errors = result.errors
      } else {
        const result = await createCatalogPlan({
          variables: {
            input: {
              name: value.name,
              code: value.code,
              currency: value.currency as CurrencyEnum,
              description: value.description || undefined,
              invoiceDisplayName: value.invoiceDisplayName || undefined,
            },
          },
        })

        catalogPlan = result.data?.createCatalogPlan
        errors = result.errors
      }

      if (hasDefinedGQLError('ValueAlreadyExist', errors)) {
        applyExistingCodeError(formApi)
        return
      }

      if (catalogPlan) {
        onSuccess({ catalogPlan, wasEdit: !!editedCatalogPlan })
        return
      }

      // `plan_locked` / `not_editable_with_applied_rate_cards` arrive as silenced
      // unprocessable_entity details; surface anything unrecognised instead of a silent no-op.
      addToast({ severity: 'danger', message: translate('text_1789030049529qvqnymyyk6j') })
    },
  })

  const resetForm = (
    catalogPlan: CatalogPlanForCatalogPlanDrawerFragment | undefined,
    defaultCurrency: CurrencyEnum,
  ): void => {
    editedCatalogPlanRef.current = catalogPlan
    form.reset(
      catalogPlan
        ? mapCatalogPlanToFormValues(catalogPlan)
        : { ...CATALOG_PLAN_FORM_DEFAULTS, currency: defaultCurrency },
      { keepDefaultValues: true },
    )
  }

  return { form, resetForm }
}

export const useCatalogPlanDrawer = (): {
  openDrawer: (catalogPlan?: CatalogPlanForCatalogPlanDrawerFragment) => void
} => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { organizationSlug } = useParams()
  const { organization } = useOrganizationInfos()
  const drawer = useFormDrawer()
  const { createMoreControl, isCreateMoreEnabled, resetCreateMore, resetSignal, notifyReset } =
    useCreateMore()

  const { form, resetForm } = useCatalogPlanForm({
    onSuccess: ({ catalogPlan, wasEdit }) => {
      if (wasEdit) {
        drawer.close()
        addToast({ severity: 'success', message: translate('text_1789030049529tdyr0nk1liw') })
        return
      }

      const catalogPlanDetailsPath = generatePath(CATALOG_PLAN_DETAILS_ROUTE, {
        catalogPlanId: catalogPlan.id,
        tab: CatalogPlanDetailsTabsOptionsEnum.overview,
      })

      if (isCreateMoreEnabled()) {
        resetForm(undefined, organization?.defaultCurrency || CurrencyEnum.Usd)
        notifyReset()
        // The drawer renders outside the matched-route context, so the router Link in
        // the toast cannot auto-prepend the org slug; bake it in here.
        addToast({
          severity: 'success',
          message: translate('text_1789030049529lpefaj6vz74', {
            planName: escapeDoubleQuotes(catalogPlan.name),
            planUrl: prependOrgSlug(catalogPlanDetailsPath, organizationSlug),
          }),
        })
        return
      }

      drawer.close()
      navigate(catalogPlanDetailsPath)
      addToast({ severity: 'success', message: translate('text_1789030049529bjp3ly202fr') })
    },
  })

  const openDrawer = (catalogPlan?: CatalogPlanForCatalogPlanDrawerFragment): void => {
    resetCreateMore()
    resetForm(catalogPlan, organization?.defaultCurrency || CurrencyEnum.Usd)

    const isAttachedToContracts = !!catalogPlan?.attachedToContracts
    const hasAppliedRateCards = (catalogPlan?.appliedRateCardsCount ?? 0) > 0

    drawer.open({
      title: translate(
        catalogPlan ? CATALOG_PLAN_DRAWER_TITLE_EDIT_KEY : CATALOG_PLAN_DRAWER_TITLE_CREATE_KEY,
      ),
      form: { id: CATALOG_PLAN_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      onEntered: focusFirstInput,
      shouldPromptOnClose: () => form.state.isDirty,
      secondaryAction: catalogPlan ? undefined : createMoreControl,
      mainAction: (
        <form.AppForm>
          <form.SubmitButton>
            {translate(
              catalogPlan ? 'text_17295436903260tlyb1gp1i7' : CATALOG_PLAN_DRAWER_TITLE_CREATE_KEY,
            )}
          </form.SubmitButton>
        </form.AppForm>
      ),
      children: (
        <CatalogPlanDrawerContent
          form={form}
          isEdit={!!catalogPlan}
          disableCodeInput={isAttachedToContracts}
          disableCurrencyInput={isAttachedToContracts || hasAppliedRateCards}
          resetSignal={resetSignal}
        />
      ),
    })
  }

  return { openDrawer }
}
