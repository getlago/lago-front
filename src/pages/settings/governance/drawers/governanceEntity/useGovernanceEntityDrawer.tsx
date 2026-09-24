import { FetchResult, gql } from '@apollo/client'
import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'

import { useCreateMore } from '~/components/drawers/createMore/useCreateMore'
import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { EXISTING_CODE_FIELD_ERRORS } from '~/core/form/existingCodeError'
import {
  LagoApiError,
  useCreateGovernanceEntityMutation,
  useUpdateGovernanceEntityMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'

import { GovernanceEntityDrawerContent } from './GovernanceEntityDrawerContent'
import {
  buildCreateUsageAttributionTypeInput,
  buildUpdateUsageAttributionTypeInput,
  GOVERNANCE_ENTITY_FORM_DEFAULTS,
  GovernanceEntity,
  governanceEntityValidationSchema,
  mapGovernanceEntityToFormValues,
} from './validationSchema'

gql`
  mutation createGovernanceEntity($input: CreateUsageAttributionTypeInput!) {
    createUsageAttributionType(input: $input) {
      id
      ...GovernanceEntityItem
    }
  }

  mutation updateGovernanceEntity($input: UpdateUsageAttributionTypeInput!) {
    updateUsageAttributionType(input: $input) {
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

export const useGovernanceEntityDrawer = (): {
  openDrawer: (entity?: GovernanceEntity) => void
} => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()
  const { createMoreControl, isCreateMoreEnabled, resetCreateMore, resetSignal, notifyReset } =
    useCreateMore()

  const [createGovernanceEntity] = useCreateGovernanceEntityMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    refetchQueries: ({ errors }) =>
      errors?.length ? [] : ['getGovernanceEntities', 'getGovernanceEntitiesRoleCounts'],
  })

  const [updateGovernanceEntity] = useUpdateGovernanceEntityMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
  })

  const editedEntityRef = useRef<GovernanceEntity | undefined>(undefined)

  const form = useAppForm({
    defaultValues: GOVERNANCE_ENTITY_FORM_DEFAULTS,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: governanceEntityValidationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const editedEntity = editedEntityRef.current
      const isEdition = !!editedEntity

      let isSaved: boolean
      let errors: FetchResult['errors']

      if (editedEntity) {
        const result = await updateGovernanceEntity({
          variables: { input: buildUpdateUsageAttributionTypeInput(editedEntity.id, value) },
        })

        isSaved = !!result.data?.updateUsageAttributionType
        errors = result.errors
      } else {
        const input = buildCreateUsageAttributionTypeInput(value)

        if (!input) return

        const result = await createGovernanceEntity({ variables: { input } })

        isSaved = !!result.data?.createUsageAttributionType
        errors = result.errors
      }

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

      if (errors?.length || !isSaved) {
        addToast({ severity: 'danger', translateKey: 'text_1790236828844gao5m0hp13y' })
        return
      }

      addToast({
        severity: 'success',
        translateKey: isEdition ? 'text_1790258263571qp7a5ha9di8' : 'text_1790236828844u3fpos3gmly',
      })

      if (!isEdition && isCreateMoreEnabled()) {
        formApi.reset(GOVERNANCE_ENTITY_FORM_DEFAULTS, { keepDefaultValues: true })
        notifyReset()
        return
      }

      drawer.close()
    },
  })

  const openDrawer = (entity?: GovernanceEntity): void => {
    editedEntityRef.current = entity
    resetCreateMore()
    form.reset(entity ? mapGovernanceEntityToFormValues(entity) : GOVERNANCE_ENTITY_FORM_DEFAULTS, {
      keepDefaultValues: true,
    })

    drawer.open({
      title: translate(entity ? 'text_1790258263571csa7fz44d2x' : 'text_1790236824869cg5v2b6hasb'),
      form: { id: GOVERNANCE_ENTITY_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      cancelOrCloseText: 'cancel',
      onEntered: focusFirstInput,
      shouldPromptOnClose: () => form.state.isDirty,
      secondaryAction: entity ? undefined : createMoreControl,
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest={GOVERNANCE_ENTITY_DRAWER_SUBMIT_TEST_ID}>
            {translate(entity ? 'text_179025826357111qsh6tn7d5' : 'text_17902441926478qzpulkexcd')}
          </form.SubmitButton>
        </form.AppForm>
      ),
      children: (
        <GovernanceEntityDrawerContent
          form={form}
          resetSignal={resetSignal}
          editedEntity={entity}
        />
      ),
    })
  }

  return { openDrawer }
}
