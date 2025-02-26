import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useFormik } from 'formik'
import { forwardRef, useState } from 'react'
import { generatePath } from 'react-router-dom'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { addToast, hasDefinedGQLError } from '~/core/apolloClient'
import { getRoleTranslationKey } from '~/core/constants/form'
import { INVITATION_ROUTE } from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  CreateInviteInput,
  GetInvitesDocument,
  GetInvitesQuery,
  InviteItemForMembersSettingsFragmentDoc,
  LagoApiError,
  MembershipRole,
  useCreateInviteMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import ErrorImage from '~/public/images/maneki/error.svg'

import { RolePickerField } from './RolePickerField'

gql`
  mutation createInvite($input: CreateInviteInput!) {
    createInvite(input: $input) {
      id
      token
      ...InviteItemForMembersSettings
    }
  }

  ${InviteItemForMembersSettingsFragmentDoc}
`

export type CreateInviteDialogRef = DialogRef

export const CreateInviteDialog = forwardRef<DialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const [inviteToken, setInviteToken] = useState<string>('')
  const invitationUrl = `${window.location.origin}${generatePath(INVITATION_ROUTE, {
    token: inviteToken,
  })}`
  const { organization } = useOrganizationInfos()
  const [createInvite, { error }] = useCreateInviteMutation({
    context: { silentErrorCodes: [LagoApiError.UnprocessableEntity] },
    onCompleted(res) {
      if (res?.createInvite?.token) {
        setInviteToken(res.createInvite.token)
      }
    },
    update(cache, { data }) {
      if (!data?.createInvite) return

      const invitesData: GetInvitesQuery | null = cache.readQuery({
        query: GetInvitesDocument,
      })

      cache.writeQuery({
        query: GetInvitesDocument,
        data: {
          invites: {
            metadata: {
              ...invitesData?.invites?.metadata,
              totalCount: (invitesData?.invites?.metadata?.totalCount || 0) + 1,
            },
            collection: [data?.createInvite, ...(invitesData?.invites?.collection || [])],
          },
        },
      })
    },
  })

  const formikProps = useFormik<CreateInviteInput>({
    initialValues: {
      email: '',
      role: MembershipRole.Admin,
    },
    validationSchema: object().shape({
      email: string().email('text_620bc4d4269a55014d493fc3').required(''),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: async (values, formikBag) => {
      const result = await createInvite({
        variables: {
          input: {
            ...values,
            email: values.email.trim(),
          },
        },
      })

      const { errors } = result

      if (
        hasDefinedGQLError('InviteAlreadyExists', errors) ||
        hasDefinedGQLError('EmailAlreadyUsed', errors)
      ) {
        formikBag.setFieldError('email', translate('text_63208c701ce25db781407456'))
      }
    },
  })

  return (
    <Dialog
      ref={ref}
      title={translate('text_63208c701ce25db78140748f')}
      description={
        inviteToken
          ? translate('text_63208c701ce25db78140743a', {
              organizationName: organization?.name,
            })
          : translate('text_63208c701ce25db78140749b')
      }
      onOpen={() => {
        formikProps.validateForm()
      }}
      onClose={() => {
        setInviteToken('')
        formikProps.resetForm()
        formikProps.validateForm()
      }}
      actions={({ closeDialog }) => (
        <>
          <Button variant="quaternary" onClick={closeDialog}>
            {translate('text_63208c711ce25db7814074cd')}
          </Button>
          {!inviteToken ? (
            <Button
              disabled={!formikProps.isValid}
              onClick={formikProps.submitForm}
              data-test="submit-invite-button"
            >
              {translate('text_63208c711ce25db7814074d9')}
            </Button>
          ) : (
            <Button
              disabled={!!error}
              onClick={() => {
                copyToClipboard(invitationUrl)

                addToast({
                  severity: 'info',
                  translateKey: 'text_63208c711ce25db781407536',
                })
                closeDialog()
              }}
              data-test="copy-invite-link-button"
            >
              {translate('text_63208c701ce25db7814074a3')}
            </Button>
          )}
        </>
      )}
    >
      <div className="mb-8 flex flex-col gap-6">
        {!inviteToken && (
          <Stack gap={8}>
            <TextInputField
              name="email"
              beforeChangeFormatter={['lowercase']}
              label={translate('text_63208c701ce25db7814074ab')}
              placeholder={translate('text_63208c711ce25db7814074c1')}
              formikProps={formikProps}
            />

            <RolePickerField
              title={translate('text_664f03016a8d2500787bb4ab')}
              onChange={(value) => formikProps.setFieldValue('role', value)}
              selectedValue={formikProps.values.role}
            />
          </Stack>
        )}
        {inviteToken && !!error && (
          <GenericPlaceholder
            noMargins
            subtitle={translate('text_63208c701ce25db781407485')}
            image={<ErrorImage width="136" height="104" />}
          />
        )}
        {inviteToken && !error && (
          <>
            <div className="flex items-baseline">
              <Typography className="w-35 shrink-0" variant="caption" color="grey600">
                {translate('text_63208c701ce25db781407458')}
              </Typography>
              <Typography variant="body" color="grey700" noWrap>
                {formikProps.values.email}
              </Typography>
            </div>
            <div className="flex items-baseline">
              <Typography className="w-35 shrink-0" variant="caption" color="grey600">
                {translate('text_664f035a68227f00e261b7ec')}
              </Typography>
              <Typography variant="body" color="grey700" noWrap>
                {translate(getRoleTranslationKey[formikProps.values.role])}
              </Typography>
            </div>
            <div className="flex items-baseline">
              <Typography className="w-35 shrink-0" variant="caption" color="grey600">
                {translate('text_63208c701ce25db781407475')}
              </Typography>
              <Typography className="line-break-anywhere" variant="body" color="grey700">
                {invitationUrl}
              </Typography>
            </div>
          </>
        )}
      </div>
    </Dialog>
  )
})

CreateInviteDialog.displayName = 'CreateInviteDialog'
