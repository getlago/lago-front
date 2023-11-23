import { gql } from '@apollo/client'
import { InputAdornment } from '@mui/material'
import { useFormik } from 'formik'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import styled from 'styled-components'
import { number, object, string } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { ComboBoxField, TextInputField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import { NetPaymentTermValuesEnum } from '~/core/constants/paymentTerm'
import {
  EditCustomerNetPaymentTermForDialogFragment,
  EditOrganizationNetPaymentTermForDialogFragment,
  useUpdateCustomerNetPaymentTermMutation,
  useUpdateOrganizationNetPaymentTermMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

gql`
  fragment EditCustomerNetPaymentTermForDialog on Customer {
    id
    externalId
    name
    netPaymentTerm
  }

  fragment EditOrganizationNetPaymentTermForDialog on Organization {
    id
    netPaymentTerm
  }

  mutation updateCustomerNetPaymentTerm($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      id
      ...EditCustomerNetPaymentTermForDialog
    }
  }

  mutation updateOrganizationNetPaymentTerm($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      id
      ...EditOrganizationNetPaymentTermForDialog
    }
  }
`

enum NetPaymentTermModelTypesEnum {
  'Customer' = 'Customer',
  'Organization' = 'Organization',
}

export interface EditNetPaymentTermDialogRef {
  openDialog: (
    model:
      | EditCustomerNetPaymentTermForDialogFragment
      | EditOrganizationNetPaymentTermForDialogFragment
      | null
      | undefined,
  ) => unknown
  closeDialog: () => unknown
}

interface EditNetPaymentTermDialogProps {
  description: string
}

export const EditNetPaymentTermDialog = forwardRef<
  EditNetPaymentTermDialogRef,
  EditNetPaymentTermDialogProps
>(({ description }: EditNetPaymentTermDialogProps, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [model, setLocalModel] = useState<
    EditCustomerNetPaymentTermForDialogFragment | EditOrganizationNetPaymentTermForDialogFragment
  >()
  const [isEdit, setIsEdit] = useState<boolean>(false)
  const [updateOrganization] = useUpdateOrganizationNetPaymentTermMutation({
    onCompleted(res) {
      if (res?.updateOrganization) {
        addToast({
          severity: 'success',
          translateKey: isEdit ? 'text_64c7a89b6c67eb6c98898181' : 'text_64c7a89b6c67eb6c98898350',
        })
      }
    },
  })
  const [updateCustomer] = useUpdateCustomerNetPaymentTermMutation({
    onCompleted(res) {
      if (res?.updateCustomer) {
        addToast({
          severity: 'success',
          translateKey: isEdit ? 'text_64c7a89b6c67eb6c98898181' : 'text_64c7a89b6c67eb6c98898350',
        })
      }
    },
  })

  const formikProps = useFormik<{
    netPaymentTerm: string | null
    customPeriod: number | null
  }>({
    initialValues: {
      netPaymentTerm:
        typeof model?.netPaymentTerm === 'number' &&
        !Object.values(NetPaymentTermValuesEnum).includes(
          String(model?.netPaymentTerm) as unknown as NetPaymentTermValuesEnum,
        )
          ? NetPaymentTermValuesEnum.custom
          : typeof model?.netPaymentTerm === 'number'
            ? String(model?.netPaymentTerm)
            : null,
      customPeriod:
        typeof model?.netPaymentTerm === 'number' &&
        !Object.values(NetPaymentTermValuesEnum).includes(
          String(model?.netPaymentTerm) as unknown as NetPaymentTermValuesEnum,
        )
          ? model?.netPaymentTerm
          : null,
    },
    validationSchema: object().shape({
      netPaymentTerm: string().required(''),
      customPeriod: number()
        .when('netPaymentTerm', {
          is: (netPaymentTerm: string) => netPaymentTerm === NetPaymentTermValuesEnum.custom,
          then: (schema) => schema.required(''),
        })
        .nullable(),
    }),
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      if (!model) return

      const localInput = {
        netPaymentTerm:
          values.netPaymentTerm === NetPaymentTermValuesEnum.custom
            ? Number(values.customPeriod)
            : Number(values.netPaymentTerm),
      }

      if (model.__typename === NetPaymentTermModelTypesEnum.Customer) {
        await updateCustomer({
          variables: {
            input: {
              id: model.id,
              externalId: model.externalId,
              name: model.name || '',
              ...localInput,
            },
          },
        })
      } else if (model.__typename === NetPaymentTermModelTypesEnum.Organization) {
        await updateOrganization({
          variables: {
            input: localInput,
          },
        })
      }
    },
  })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      !!data && setLocalModel(data)
      setIsEdit(typeof data?.netPaymentTerm === 'number')
      dialogRef.current?.openDialog()
    },
    closeDialog: () => {
      dialogRef.current?.closeDialog()
    },
  }))

  return (
    <Dialog
      ref={dialogRef}
      title={translate(isEdit ? 'text_64c7a89b6c67eb6c988981e0' : 'text_64c7a89b6c67eb6c9889822d')}
      description={description}
      onClose={() => {
        formikProps.resetForm()
        formikProps.validateForm()
        setIsEdit(false)
        setLocalModel(undefined)
      }}
      actions={({ closeDialog }) => (
        <>
          <Button variant="quaternary" onClick={closeDialog}>
            {translate('text_62bb10ad2a10bd182d002031')}
          </Button>
          <Button
            variant="primary"
            disabled={!formikProps.isValid || !formikProps.dirty}
            onClick={async () => {
              await formikProps.submitForm()
              closeDialog()
            }}
          >
            {translate(isEdit ? 'text_64c7a89b6c67eb6c988981e0' : 'text_64c7a89b6c67eb6c98898073')}
          </Button>
        </>
      )}
    >
      <ContentWrapper>
        <ComboBoxField
          name="netPaymentTerm"
          label={translate('text_64c7a89b6c67eb6c98898109')}
          placeholder={translate('text_64c7b3014f5c4639c4a51ab0')}
          formikProps={formikProps}
          sortValues={false}
          data={[
            {
              value: NetPaymentTermValuesEnum.zero,
              label: translate('text_64c7a89b6c67eb6c98898125'),
            },
            {
              value: NetPaymentTermValuesEnum.thirty,
              label: translate(
                'text_64c7a89b6c67eb6c9889815f',
                {
                  days: 30,
                },
                30,
              ),
            },
            {
              value: NetPaymentTermValuesEnum.sixty,
              label: translate(
                'text_64c7a89b6c67eb6c9889815f',
                {
                  days: 60,
                },
                60,
              ),
            },
            {
              value: NetPaymentTermValuesEnum.ninety,
              label: translate(
                'text_64c7a89b6c67eb6c9889815f',
                {
                  days: 90,
                },
                90,
              ),
            },
            {
              value: NetPaymentTermValuesEnum.custom,
              label: translate('text_64c7a89b6c67eb6c988981ae'),
            },
          ]}
          PopperProps={{ displayInDialog: true }}
        />

        {formikProps.values.netPaymentTerm === NetPaymentTermValuesEnum.custom && (
          <TextInputField
            name="customPeriod"
            label={translate('text_64c7a89b6c67eb6c988981ae')}
            placeholder={translate('text_62ff5d01a306e274d4ffcc3c')}
            beforeChangeFormatter={['positiveNumber', 'int']}
            formikProps={formikProps}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {translate('text_638dc196fb209d551f3d814d')}
                </InputAdornment>
              ),
            }}
          />
        )}
      </ContentWrapper>
    </Dialog>
  )
})

const ContentWrapper = styled.div`
  display: flex;
  gap: ${theme.spacing(3)};
  margin-bottom: ${theme.spacing(8)};

  > * {
    flex: 1;
  }

  ${theme.breakpoints.down('md')} {
    flex-direction: column;
  }
`

EditNetPaymentTermDialog.displayName = 'forwardRef'
