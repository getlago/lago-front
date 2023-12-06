// TODO:
import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { forwardRef } from 'react'
import { useNavigate } from 'react-router'
import styled from 'styled-components'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { ComboBoxField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import { DOCUMENTATION_URL } from '~/core/constants/externalUrls'
import { countryDataForCombobox } from '~/core/formats/countryDataForCombobox'
import { TAX_MANAGEMENT_INTEGRATION_ROUTE } from '~/core/router'
import {
  CountryCode,
  UpdateOrganizationInput,
  useUpdateOrgaForTagoTaxManagementMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

gql`
  mutation updateOrgaForTagoTaxManagement($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      id
    }
  }
`

export interface AddLagoTaxManagementDialogRef extends DialogRef {}

interface AddStripDialog {
  country?: CountryCode | null
}

export const AddLagoTaxManagementDialog = forwardRef<AddLagoTaxManagementDialogRef, AddStripDialog>(
  ({ country }: AddStripDialog, ref) => {
    const { translate } = useInternationalization()
    const navigate = useNavigate()
    const formikProps = useFormik<UpdateOrganizationInput>({
      initialValues: {
        country,
      },
      validationSchema: object().shape({
        country: string().required(''),
      }),
      onSubmit: async (values) => {
        await updateOrga({
          variables: {
            input: {
              ...values,
              euTaxManagement: true,
            },
          },
        })
      },
      validateOnMount: true,
      enableReinitialize: true,
    })
    const [updateOrga] = useUpdateOrgaForTagoTaxManagementMutation({
      onCompleted({ updateOrganization }) {
        if (updateOrganization?.id) {
          navigate(TAX_MANAGEMENT_INTEGRATION_ROUTE)
          addToast({
            message: translate('text_657078c28394d6b1ae1b980e'),
            severity: 'success',
          })
        }
      },
    })

    return (
      <Dialog
        ref={ref}
        title={translate('text_657078c28394d6b1ae1b974d')}
        description={
          <Typography
            variant="body"
            color="grey600"
            html={translate('text_657078c28394d6b1ae1b9759', {
              href: DOCUMENTATION_URL,
            })}
          />
        }
        onClose={() => {
          formikProps.resetForm()
        }}
        actions={({ closeDialog }) => (
          <>
            <Button variant="quaternary" onClick={closeDialog}>
              {translate('text_63eba8c65a6c8043feee2a14')}
            </Button>
            <Button
              variant="primary"
              disabled={!formikProps.isValid}
              onClick={async () => {
                await formikProps.submitForm()
                closeDialog()
              }}
            >
              {translate('text_657078c28394d6b1ae1b9789')}
            </Button>
          </>
        )}
      >
        <Content>
          <ComboBoxField
            data={countryDataForCombobox}
            name="country"
            label={translate('text_657078c28394d6b1ae1b9765')}
            placeholder={translate('text_657078c28394d6b1ae1b9771')}
            formikProps={formikProps}
            PopperProps={{ displayInDialog: true }}
          />
        </Content>
      </Dialog>
    )
  },
)

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

AddLagoTaxManagementDialog.displayName = 'AddLagoTaxManagementDialog'
