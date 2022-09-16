import { forwardRef, useState } from 'react'
import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { object, string } from 'yup'
import styled from 'styled-components'

import { theme } from '~/styles'
import { Button, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { TextInputField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { CreateInviteInput, Lago_Api_Error, useCreateInviteMutation } from '~/generated/graphql'
import ErrorImage from '~/public/images/maneki/error.svg'
import { addToast, LagoGQLError, useCurrentUserInfosVar } from '~/core/apolloClient'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'

gql`
  mutation createInvite($input: CreateInviteInput!) {
    createInvite(input: $input) {
      id
      token
    }
  }
`

export interface CreateInviteDialogRef extends DialogRef {}

export const CreateInviteDialog = forwardRef<DialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const { currentOrganization } = useCurrentUserInfosVar()
  const [inviteToken, setInviteToken] = useState<string>()
  const [createInvite, { error }] = useCreateInviteMutation({
    onCompleted(res) {
      if (res?.createInvite?.token) {
        setInviteToken(res.createInvite.token)
      }
    },
  })

  const formikProps = useFormik<CreateInviteInput>({
    initialValues: {
      email: '',
    },
    validationSchema: object().shape({
      email: string().email().required(''),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: async (values, formikBag) => {
      const result = await createInvite({
        variables: {
          input: {
            ...values,
          },
        },
        refetchQueries: ['getInvites'],
      })

      const { errors } = result

      const apiError = !errors ? undefined : (errors[0]?.extensions as LagoGQLError['extensions'])

      if (
        !!apiError &&
        apiError?.code === Lago_Api_Error.UnprocessableEntity &&
        !!apiError?.details?.invite
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
              organizationName: currentOrganization?.name,
            })
          : translate('text_63208c701ce25db78140749b')
      }
      onOpen={() => {
        setInviteToken('')
        formikProps.resetForm()
        formikProps.validateForm()
      }}
      actions={({ closeDialog }) => (
        <>
          <Button
            variant="quaternary"
            onClick={() => {
              closeDialog()
            }}
          >
            {translate('text_63208c711ce25db7814074cd')}
          </Button>
          {!inviteToken ? (
            <Button
              disabled={!formikProps.isValid}
              onClick={async () => {
                await formikProps.submitForm()
              }}
            >
              {translate('text_63208c711ce25db7814074d9')}
            </Button>
          ) : (
            <Button
              disabled={!!error}
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/invitation/${inviteToken}`)
                addToast({
                  severity: 'info',
                  translateKey: 'text_63208c711ce25db781407536',
                })
                closeDialog()
              }}
            >
              {translate('text_63208c701ce25db7814074a3')}
            </Button>
          )}
        </>
      )}
    >
      <Content>
        {!inviteToken ? (
          <TextInputField
            name="email"
            label={translate('text_63208c701ce25db7814074ab')}
            placeholder={translate('text_63208c711ce25db7814074c1')}
            formikProps={formikProps}
          />
        ) : !!error ? (
          <GenericPlaceholder
            noMargins
            subtitle={translate('text_63208c701ce25db781407485')}
            image={<ErrorImage width="136" height="104" />}
          />
        ) : (
          <>
            <Line>
              <Label variant="caption" color="grey600">
                {translate('text_63208c701ce25db781407458')}
              </Label>
              <Typography variant="body" color="grey700" noWrap>
                {formikProps.values.email}
              </Typography>
            </Line>
            <Line>
              <Label variant="caption" color="grey600">
                {translate('text_63208c701ce25db781407475')}
              </Label>
              <Typography variant="body" color="grey700" noWrap>
                {`${window.location.origin}/invitation/${inviteToken}`}
              </Typography>
            </Line>
          </>
        )}
      </Content>
    </Dialog>
  )
})

const Content = styled.div`
  > * {
    margin-bottom: ${theme.spacing(6)};
  }

  &:last-child {
    margin-bottom: ${theme.spacing(8)};
  }
`

const Line = styled.div`
  display: flex;
  align-items: center;
`

const Label = styled(Typography)`
  width: 140px;
  flex-shrink: 0;
`

CreateInviteDialog.displayName = 'CreateInviteDialog'
