import { gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'

import { useCreateMore } from '~/components/drawers/createMore/useCreateMore'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { EXISTING_CODE_FIELD_ERRORS } from '~/core/form/existingCodeError'
import { LagoApiError, useCreateGovernanceEntityMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import { GovernanceEntityDrawerContent } from './GovernanceEntityDrawerContent'
import {
  buildCreateUsageAttributionTypeInput,
  GOVERNANCE_ENTITY_FORM_DEFAULTS,
  governanceEntityValidationSchema,
} from './validationSchema'

gql`
  mutation createGovernanceEntity($input: CreateUsageAttributionTypeInput!) {
    createUsageAttributionType(input: $input) {
      id
      ...GovernanceEntityItem
    }
  }
`

const GOVERNANCE_ENTITY_FORM_ID = 'governance-entity-drawer-form'

const GOVERNANCE_ENTITY_DRAWER_SUBMIT_TEST_ID = 'governance-entity-drawer-submit'

const ATTRIBUTION_KEYS_TAKEN_FIELD_ERRORS = {
  attributionKeys: { message: 'text_1790236828844v9irmcydet9', path: ['attributionKeys'] },
}

export const useGovernanceEntityDrawer = (): { openDrawer: () => void } => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()
  const { createMoreControl, isCreateMoreEnabled, resetCreateMore, resetSignal, notifyReset } =
    useCreateMore()

  const [createGovernanceEntity] = useCreateGovernanceEntityMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    refetchQueries: ['getGovernanceEntities', 'getGovernanceEntitiesRoleCounts'],
  })

  const form = useAppForm({
    defaultValues: GOVERNANCE_ENTITY_FORM_DEFAULTS,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: governanceEntityValidationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const input = buildCreateUsageAttributionTypeInput(value)

      if (!input) return

      const { data, errors } = await createGovernanceEntity({ variables: { input } })

      const fieldErrors = {
        ...(hasDefinedGQLError('ValueAlreadyExist', errors, 'code')
          ? EXISTING_CODE_FIELD_ERRORS
          : {}),
        ...(hasDefinedGQLError('ValueAlreadyExist', errors, 'attributionKeys')
          ? ATTRIBUTION_KEYS_TAKEN_FIELD_ERRORS
          : {}),
      }

      if (Object.keys(fieldErrors).length) {
        formApi.setErrorMap({ onDynamic: { fields: fieldErrors } })
        return
      }

      if (errors?.length || !data?.createUsageAttributionType) {
        addToast({ severity: 'danger', translateKey: 'text_1790236828844gao5m0hp13y' })
        return
      }

      addToast({ severity: 'success', translateKey: 'text_1790236828844u3fpos3gmly' })

      if (isCreateMoreEnabled()) {
        formApi.reset(GOVERNANCE_ENTITY_FORM_DEFAULTS, { keepDefaultValues: true })
        notifyReset()
        return
      }

      drawer.close()
    },
  })

  const openDrawer = (): void => {
    resetCreateMore()
    form.reset(GOVERNANCE_ENTITY_FORM_DEFAULTS, { keepDefaultValues: true })

    drawer.open({
      title: translate('text_1790236824869cg5v2b6hasb'),
      form: { id: GOVERNANCE_ENTITY_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      onEntered: focusFirstInput,
      shouldPromptOnClose: () => form.state.isDirty,
      secondaryAction: createMoreControl,
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest={GOVERNANCE_ENTITY_DRAWER_SUBMIT_TEST_ID}>
            {translate('text_17902441926478qzpulkexcd')}
          </form.SubmitButton>
        </form.AppForm>
      ),
      children: <GovernanceEntityDrawerContent form={form} resetSignal={resetSignal} />,
    })
  }

  return { openDrawer }
}
