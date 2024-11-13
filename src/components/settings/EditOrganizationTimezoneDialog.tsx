import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { Settings } from 'luxon'
import { forwardRef } from 'react'
import styled from 'styled-components'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { ComboBoxField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import { getTimezoneConfig } from '~/core/timezone'
import { TimezoneEnum, useUpdateOrganizationTimezoneMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

gql`
  mutation updateOrganizationTimezone($input: UpdateOrganizationInput!) {
    updateOrganization(input: $input) {
      id
      timezone
    }
  }
`

export type EditOrganizationTimezoneDialogRef = DialogRef
interface EditOrganizationTimezoneProps {
  timezone?: TimezoneEnum | null
}

export const EditOrganizationTimezoneDialog = forwardRef<
  EditOrganizationTimezoneDialogRef,
  EditOrganizationTimezoneProps
>(({ timezone }: EditOrganizationTimezoneProps, ref) => {
  const { translate } = useInternationalization()
  const [update] = useUpdateOrganizationTimezoneMutation({
    onCompleted(res) {
      if (res?.updateOrganization) {
        addToast({
          severity: 'success',
          translateKey: 'text_63891ad3dd238c657ea00954',
        })
        Settings.defaultZone = getTimezoneConfig(res?.updateOrganization?.timezone).name
      }
    },
  })
  const formikProps = useFormik({
    initialValues: {
      timezone,
    },
    validationSchema: object().shape({
      timezone: string().required(''),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: async (values) => {
      await update({
        variables: {
          input: {
            ...values,
          },
        },
      })
    },
  })

  return (
    <Dialog
      ref={ref}
      title={translate('text_63890710eb171a76814a0c0d')}
      description={translate('text_63890710eb171a76814a0c0f')}
      onClose={() => {
        formikProps.resetForm()
        formikProps.validateForm()
      }}
      actions={({ closeDialog }) => (
        <>
          <Button variant="quaternary" onClick={closeDialog}>
            {translate('text_63890710eb171a76814a0c15')}
          </Button>
          <Button
            variant="primary"
            disabled={!formikProps.isValid || !formikProps.dirty}
            onClick={async () => {
              await formikProps.submitForm()
              closeDialog()
            }}
          >
            {translate('text_63890710eb171a76814a0c17')}
          </Button>
        </>
      )}
    >
      <Content>
        <ComboBoxField
          name="timezone"
          label={translate('text_63890710eb171a76814a0c11')}
          formikProps={formikProps}
          PopperProps={{ displayInDialog: true }}
          placeholder={translate('text_6390a4ffef9227ba45daca92')}
          data={Object.values(TimezoneEnum).map((timezoneValue) => ({
            value: timezoneValue,
            label: translate('text_638f743fa9a2a9545ee6409a', {
              zone: translate(timezoneValue),
              offset: getTimezoneConfig(timezoneValue).offset,
            }),
          }))}
        />
      </Content>
    </Dialog>
  )
})

const Content = styled.div`
  margin-bottom: ${theme.spacing(8)};
`

EditOrganizationTimezoneDialog.displayName = 'EditOrganizationTimezoneDialog'
