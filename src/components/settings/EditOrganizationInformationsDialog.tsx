import { forwardRef, useRef, useState } from 'react'
import { useFormik } from 'formik'
import { object, string } from 'yup'
import { gql } from '@apollo/client'
import styled from 'styled-components'

import { Avatar, Button, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { ComboBoxField, TextInput, TextInputField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  EditOrganizationInformationsDialogFragment,
  OrganizationInformationsFragmentDoc,
  UpdateOrganizationInput,
  useUpdateOrganizationInformationsMutation,
} from '~/generated/graphql'
import { theme } from '~/styles'
import { addToast } from '~/core/apolloClient'
import { countryDataForCombobox } from '~/core/countryCodes'

const FILE_MAX_SIZE = 800000

gql`
  fragment EditOrganizationInformationsDialog on Organization {
    id
    logoUrl
    name
    legalName
    legalNumber
    email
    addressLine1
    addressLine2
    zipcode
    city
    state
    country
  }

  mutation updateOrganizationInformations($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      ...OrganizationInformations
      ...EditOrganizationInformationsDialog
    }
  }
  ${OrganizationInformationsFragmentDoc}
`

export interface EditOrganizationInformationsDialogRef extends DialogRef {}

interface EditOrganizationInformationsProps {
  organization: EditOrganizationInformationsDialogFragment
}

export const EditOrganizationInformationsDialog = forwardRef<
  DialogRef,
  EditOrganizationInformationsProps
>(({ organization }: EditOrganizationInformationsProps, ref) => {
  const { translate } = useInternationalization()
  const [updateOrganizationInformations] = useUpdateOrganizationInformationsMutation({
    onCompleted(res) {
      if (res?.updateOrganization) {
        addToast({
          severity: 'success',
          translateKey: 'text_62ab2d0396dd6b0361614ddc',
        })
      }
    },
  })
  const [logo, setLogo] = useState<string>()
  const [logoUploadError, setLogoUploadError] = useState(false)
  const hiddenFileInputRef = useRef<HTMLInputElement>(null)
  const formikProps = useFormik<UpdateOrganizationInput>({
    initialValues: {
      legalName: organization?.legalName || '',
      legalNumber: organization?.legalNumber || '',
      email: organization?.email || '',
      addressLine1: organization?.addressLine1 || '',
      addressLine2: organization?.addressLine2 || '',
      zipcode: organization?.zipcode || '',
      city: organization?.city || '',
      state: organization?.state || '',
      country: organization?.country || undefined,
    },
    validationSchema: object().shape({
      email: string().email('text_620bc4d4269a55014d493fc3'),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: async (values) => {
      await updateOrganizationInformations({
        variables: {
          input: {
            logo,
            ...values,
          },
        },
      })
    },
  })

  const getBase64 = (file: Blob) => {
    var reader = new FileReader()

    if (file.size > FILE_MAX_SIZE) {
      setLogoUploadError(true)
      return
    }

    reader.readAsDataURL(file)
    reader.onload = () => {
      setLogo(reader?.result?.toString())
    }
    reader.onerror = (error) => {
      // eslint-disable-next-line no-console
      console.error('Error: ', error)
    }
  }

  return (
    <Dialog
      ref={ref}
      title={translate('text_62ab2d0396dd6b0361614d10')}
      actions={({ closeDialog }) => (
        <>
          <Button
            variant="quaternary"
            onClick={() => {
              closeDialog()
              formikProps.resetForm()
            }}
          >
            {translate('text_62ab2d0396dd6b0361614da8')}
          </Button>
          <Button
            variant="primary"
            disabled={!formikProps.isValid || (!formikProps.dirty && !logo)}
            onClick={async () => {
              await formikProps.submitForm()
              closeDialog()
              formikProps.resetForm()
            }}
          >
            {translate('text_62ab2d0396dd6b0361614db2')}
          </Button>
        </>
      )}
    >
      <Content>
        <FormSection>
          <AvatarContainer>
            {logo || organization?.logoUrl ? (
              <Avatar size="large" variant="connector">
                <img
                  src={(logo || organization?.logoUrl) as string}
                  alt={`${organization?.name}'s logo`}
                />
              </Avatar>
            ) : (
              <Avatar
                size="large"
                variant="company"
                identifier={organization?.name || ''}
                initials={(organization?.name || '')
                  .split(' ')
                  .reduce((acc, n) => (acc = acc + n[0]), '')}
              />
            )}
            <AvatarUploadWrapper>
              <ChooseFileButton
                variant="secondary"
                onClick={() => hiddenFileInputRef?.current?.click()}
              >
                {translate('text_62ab2d0396dd6b0361614d18')}
              </ChooseFileButton>
              <Typography variant="caption" color={logoUploadError ? 'danger600' : undefined}>
                {logoUploadError
                  ? translate('text_62ab2d0396dd6b0361614d1e')
                  : translate('text_62ab2d0396dd6b0361614d20')}
              </Typography>
            </AvatarUploadWrapper>
            <HiddenInput
              type="file"
              accept="image/png, image/jpeg"
              ref={hiddenFileInputRef}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                setLogoUploadError(false)
                const file = event?.target?.files?.[0]

                if (file) {
                  getBase64(file)
                }
              }}
            />
          </AvatarContainer>
        </FormSection>
        <FormSection>
          <TextInput
            name="name"
            label={translate('text_62b95bf4a482330b71b8acb2')}
            placeholder={translate('text_62b95bf4a482330b71b8acb2')}
            value={organization?.name}
            disabled={true}
          />
        </FormSection>
        <FormSection>
          <TextInputField
            name="legalName"
            label={translate('text_62ab2d0396dd6b0361614d40')}
            placeholder={translate('text_62ab2d0396dd6b0361614d48')}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            formikProps={formikProps}
          />
        </FormSection>
        <FormSection>
          <TextInputField
            name="legalNumber"
            label={translate('text_62ab2d0396dd6b0361614d50')}
            placeholder={translate('text_62ab2d0396dd6b0361614d58')}
            formikProps={formikProps}
          />
        </FormSection>
        <FormSection>
          <TextInputField
            name="email"
            label={translate('text_62ab2d0396dd6b0361614d60')}
            placeholder={translate('text_62ab2d0396dd6b0361614d68')}
            formikProps={formikProps}
          />
        </FormSection>
        <AddressSection>
          <TextInputField
            name="addressLine1"
            label={translate('text_62ab2d0396dd6b0361614d70')}
            placeholder={translate('text_62ab2d0396dd6b0361614d78')}
            formikProps={formikProps}
          />
          <TextInputField
            name="addressLine2"
            placeholder={translate('text_62ab2d0396dd6b0361614d80')}
            formikProps={formikProps}
          />
          <TextInputField
            name="zipcode"
            placeholder={translate('text_62ab2d0396dd6b0361614d88')}
            formikProps={formikProps}
          />
          <TextInputField
            name="city"
            placeholder={translate('text_62ab2d0396dd6b0361614d90')}
            formikProps={formikProps}
          />
          <TextInputField
            name="state"
            placeholder={translate('text_62ab2d0396dd6b0361614d98')}
            formikProps={formikProps}
          />
          <ComboBoxField
            data={countryDataForCombobox}
            name="country"
            placeholder={translate('text_62ab2d0396dd6b0361614da0')}
            formikProps={formikProps}
            PopperProps={{ displayInDialog: true }}
          />
        </AddressSection>
      </Content>
    </Dialog>
  )
})

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};
`

const FormSection = styled.div`
  &:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

const AvatarContainer = styled.div`
  display: flex;

  > *:first-child {
    margin-right: ${theme.spacing(4)};
  }
`

const AvatarUploadWrapper = styled.div`
  display: flex;
  flex-direction: column;

  > button {
    margin-bottom: ${theme.spacing(2)};
  }
`

const ChooseFileButton = styled(Button)`
  width: fit-content;
`

const HiddenInput = styled.input`
  display: none;
`

const AddressSection = styled.div`
  > * {
    margin-bottom: ${theme.spacing(4)};
  }
`

EditOrganizationInformationsDialog.displayName = 'forwardRef'
