import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import styled from 'styled-components'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { ComboBoxField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import {
  CurrencyEnum,
  EditOrganizationDefaultCurrencyForDialogFragment,
  UpdateOrganizationInput,
  useUpdateOrganizationDefaultCurrencyMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

gql`
  fragment EditOrganizationDefaultCurrencyForDialog on Organization {
    id
    defaultCurrency
  }

  mutation updateOrganizationDefaultCurrency($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      id
      ...EditOrganizationDefaultCurrencyForDialog
    }
  }
`

export interface EditDefaultCurrencyDialogRef {
  openDialog: (localData: EditDefaultCurrencyDialogImperativeProps) => unknown
  closeDialog: () => unknown
}

type EditDefaultCurrencyDialogImperativeProps = {
  organization?: EditOrganizationDefaultCurrencyForDialogFragment | null
}

export const EditDefaultCurrencyDialog = forwardRef<EditDefaultCurrencyDialogRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<EditDefaultCurrencyDialogImperativeProps | null>(null)
  const [updateOrganization] = useUpdateOrganizationDefaultCurrencyMutation({
    onCompleted(res) {
      if (res?.updateOrganization) {
        addToast({
          severity: 'success',
          translateKey: 'text_6543ca0fdebf76a18e159303',
        })
      }
    },
  })

  const formikProps = useFormik<Pick<UpdateOrganizationInput, 'defaultCurrency'>>({
    initialValues: {
      defaultCurrency: localData?.organization?.defaultCurrency || CurrencyEnum.Usd,
    },
    validationSchema: object().shape({
      defaultCurrency: string()
        .test({
          test: function (defaultCurrency) {
            return Object.values(CurrencyEnum).includes(defaultCurrency as CurrencyEnum)
          },
        })
        .required(''),
    }),
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async (values) => {
      await updateOrganization({
        variables: {
          input: values,
        },
      })
    },
  })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setLocalData(data)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => {
      dialogRef.current?.closeDialog()
    },
  }))

  return (
    <Dialog
      ref={dialogRef}
      title={translate('text_6543ca0fdebf76a18e159294')}
      description={translate('text_6543ca0fdebf76a18e159298')}
      onClose={() => {
        formikProps.resetForm()
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
              formikProps.resetForm()
              setLocalData(null)
            }}
          >
            {translate('text_6543ca0fdebf76a18e159294')}
          </Button>
        </>
      )}
    >
      <ContentWrapper>
        <ComboBoxField
          disableClearable
          name="defaultCurrency"
          label={translate('text_6543ca0fdebf76a18e15929c')}
          data={Object.values(CurrencyEnum).map((currencyType) => ({
            value: currencyType,
          }))}
          PopperProps={{ displayInDialog: true }}
          formikProps={formikProps}
        />
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

EditDefaultCurrencyDialog.displayName = 'forwardRef'
