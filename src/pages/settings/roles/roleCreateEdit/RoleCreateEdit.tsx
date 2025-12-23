import { revalidateLogic } from '@tanstack/react-form'
import { useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import { Button, Typography, WarningDialog, WarningDialogRef } from '~/components/designSystem'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import { ROLE_DETAILS_ROUTE, ROLES_LIST_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { mapFromApiToForm } from '~/pages/settings/roles/common/rolePermissionsForm/mappers/mapFromApiToForm'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

import { useRoleCreateEdit } from './useRoleCreateEdit'

import { mapFromFormToApi } from '../common/rolePermissionsForm/mappers/mapFromFormToApi'
import RolePermissionsForm from '../common/rolePermissionsForm/RolePermissionsForm'
import { validationSchema } from '../common/rolePermissionsForm/validationSchema'
import { useRoleDetails } from '../common/useRoleDetails'

export const SUBMIT_ROLE_DATA_TEST = 'submit-role-button'
export const ROLE_CREATE_EDIT_FORM_ID = 'role-create-edit-form'

const RoleCreateEdit = () => {
  const navigate = useNavigate()

  const { translate } = useInternationalization()

  const warningDialogRef = useRef<WarningDialogRef>(null)

  const { roleId, isEdition, handleSave } = useRoleCreateEdit()

  const { role, isLoadingRole } = useRoleDetails({ roleId })

  const isFormReady = !isLoadingRole

  const submitButtonText = isEdition
    ? translate('text_1765528921745ibx4b56q1mt')
    : translate('text_1766138146087w2ax628r6j1')

  const formTitle = isEdition
    ? translate('text_1766138146087vq4eqb2moza')
    : translate('text_176613814608779rumjj7r2d')

  const formDescription = isEdition
    ? translate('text_1766138201147d9p3xi519nq')
    : translate('text_176613820114657nlabp19lm')

  const form = useAppForm({
    defaultValues: mapFromApiToForm(role),
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: validationSchema,
    },
    onSubmit: async ({ value, formApi }) => {
      const formattedValues = mapFromFormToApi(value)

      const answer = await handleSave(formattedValues)

      const { errors } = answer

      if (hasDefinedGQLError('ValueAlreadyExist', errors)) {
        formApi.setErrorMap({
          onDynamic: {
            fields: {
              name: {
                message: 'text_626162c62f790600f850b728',
                path: ['name'],
              },
            },
          },
        })
        return
      }

      const toastMessage = isEdition
        ? translate('text_176615894759841ijqrfnb29')
        : translate('text_1766158947598y30l6z5btl6')

      addToast({
        message: toastMessage,
        severity: 'success',
      })

      // TODO: Change this when we get id from API
      handleClose()
    },
    onSubmitInvalid({ formApi }) {
      scrollToFirstInputError(ROLE_CREATE_EDIT_FORM_ID, formApi.state.errorMap.onDynamic || {})
    },
  })

  const handleClose = () => {
    if (isEdition && roleId) {
      navigate(generatePath(ROLE_DETAILS_ROUTE, { roleId }))
    } else {
      navigate(generatePath(ROLES_LIST_ROUTE))
    }
  }
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    form.handleSubmit()
  }

  const handleAbort = () => {
    if (form.state.isDirty) {
      warningDialogRef.current?.openDialog()
      return
    }

    handleClose()
  }

  return (
    <CenteredPage.Wrapper>
      <form
        id={ROLE_CREATE_EDIT_FORM_ID}
        className="flex min-h-full flex-col"
        onSubmit={handleSubmit}
      >
        <CenteredPage.Header>
          <Typography variant="bodyHl" color="textSecondary" noWrap>
            {formTitle}
          </Typography>
          <Button variant="quaternary" icon="close" onClick={handleAbort} />
        </CenteredPage.Header>

        {!isFormReady && (
          <CenteredPage.Container>
            <FormLoadingSkeleton id={ROLE_CREATE_EDIT_FORM_ID} />
          </CenteredPage.Container>
        )}

        {isFormReady && (
          <CenteredPage.Container>
            <div className="flex flex-col gap-1">
              <Typography variant="headline" color="textSecondary">
                {formTitle}
              </Typography>
              <Typography variant="body">{formDescription}</Typography>
            </div>
            <div className="flex flex-col gap-6 pb-12 shadow-b">
              <form.AppField name="name">
                {(field) => (
                  <field.TextInputField
                    label={translate('text_1765464417018tezju4yvyoo')}
                    placeholder={translate('text_17661418987504ov1o9cqxp9')}
                  />
                )}
              </form.AppField>
              <form.AppField name="description">
                {(field) => (
                  <field.TextInputField
                    label={translate('text_6388b923e514213fed58331c')}
                    placeholder={translate('text_176614189875029z5fbpnkne')}
                    isOptional
                    rows="3"
                    multiline
                  />
                )}
              </form.AppField>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <Typography variant="subhead1">
                  {translate('text_1766149969683xorkc7s7fcj')}
                </Typography>
                <Typography variant="body">{translate('text_1766149969683a8fo8a1bc87')}</Typography>
              </div>
              <RolePermissionsForm
                form={form}
                fields="permissions"
                isEditable={true}
                isLoading={isLoadingRole}
              />
            </div>
          </CenteredPage.Container>
        )}

        <CenteredPage.StickyFooter>
          <Button size="large" variant="quaternary" onClick={handleAbort}>
            {translate('text_62e79671d23ae6ff149de968')}
          </Button>
          <form.AppForm>
            <form.SubmitButton dataTest={SUBMIT_ROLE_DATA_TEST}>
              {submitButtonText}
            </form.SubmitButton>
          </form.AppForm>
        </CenteredPage.StickyFooter>
      </form>

      <WarningDialog
        ref={warningDialogRef}
        title={translate('text_665deda4babaf700d603ea13')}
        description={translate('text_665dedd557dc3c00c62eb83d')}
        continueText={translate('text_645388d5bdbd7b00abffa033')}
        onContinue={handleClose}
      />
    </CenteredPage.Wrapper>
  )
}

export default RoleCreateEdit
