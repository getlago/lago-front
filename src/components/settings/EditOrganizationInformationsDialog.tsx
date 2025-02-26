import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { forwardRef, useState } from 'react'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { ComboBoxField, TextInput, TextInputField } from '~/components/form'
import { OrganizationLogoPicker } from '~/components/OrganizationLogoPicker'
import { addToast } from '~/core/apolloClient'
import { countryDataForCombobox } from '~/core/formats/countryDataForCombobox'
import {
  EditOrganizationInformationsDialogFragment,
  OrganizationInformationsFragmentDoc,
  UpdateOrganizationInput,
  useUpdateOrganizationInformationsMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  fragment EditOrganizationInformationsDialog on CurrentOrganization {
    id
    logoUrl
    name
    legalName
    legalNumber
    taxIdentificationNumber
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

export type EditOrganizationInformationsDialogRef = DialogRef

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
  const [logo, setLogo] = useState<string | undefined>(undefined)
  const formikProps = useFormik<UpdateOrganizationInput>({
    initialValues: {
      legalName: organization?.legalName || '',
      legalNumber: organization?.legalNumber || '',
      taxIdentificationNumber: organization?.taxIdentificationNumber || '',
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

  return (
    <Dialog
      ref={ref}
      title={translate('text_62ab2d0396dd6b0361614d10')}
      onClose={() => {
        formikProps.resetForm()
        setLogo(undefined)
      }}
      actions={({ closeDialog }) => (
        <>
          <Button variant="quaternary" onClick={closeDialog}>
            {translate('text_62ab2d0396dd6b0361614da8')}
          </Button>
          <Button
            variant="primary"
            disabled={!formikProps.isValid || (!formikProps.dirty && !logo)}
            onClick={async () => {
              await formikProps.submitForm()
              closeDialog()
            }}
          >
            {translate('text_62ab2d0396dd6b0361614db2')}
          </Button>
        </>
      )}
    >
      <div className="mb-8 flex flex-col gap-6">
        <OrganizationLogoPicker logoValue={logo} onChange={(value) => setLogo(value)} />

        <TextInput
          name="name"
          label={translate('text_62b95bf4a482330b71b8acb2')}
          placeholder={translate('text_62b95bf4a482330b71b8acb2')}
          value={organization?.name}
          disabled={true}
        />

        <TextInputField
          name="legalName"
          label={translate('text_62ab2d0396dd6b0361614d40')}
          placeholder={translate('text_62ab2d0396dd6b0361614d48')}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          formikProps={formikProps}
        />

        <TextInputField
          name="legalNumber"
          label={translate('text_62ab2d0396dd6b0361614d50')}
          placeholder={translate('text_62ab2d0396dd6b0361614d58')}
          formikProps={formikProps}
        />

        <TextInputField
          name="taxIdentificationNumber"
          label={translate('text_648053ee819b60364c675d05')}
          placeholder={translate('text_648053ee819b60364c675d0b')}
          formikProps={formikProps}
        />

        <TextInputField
          name="email"
          beforeChangeFormatter={['lowercase']}
          label={translate('text_62ab2d0396dd6b0361614d60')}
          placeholder={translate('text_62ab2d0396dd6b0361614d68')}
          formikProps={formikProps}
        />

        <div className="flex flex-col gap-4">
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
        </div>
      </div>
    </Dialog>
  )
})

EditOrganizationInformationsDialog.displayName = 'forwardRef'
