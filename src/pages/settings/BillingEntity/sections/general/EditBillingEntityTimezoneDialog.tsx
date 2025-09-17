import { gql } from '@apollo/client'
import { useFormik } from 'formik'
import { Settings } from 'luxon'
import { forwardRef } from 'react'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { ComboBoxField } from '~/components/form'
import { addToast } from '~/core/apolloClient'
import { getTimezoneConfig } from '~/core/timezone'
import { TimezoneEnum, useUpdateBillingEntityTimezoneMutation } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  mutation updateBillingEntityTimezone($input: UpdateBillingEntityInput!) {
    updateBillingEntity(input: $input) {
      id
      timezone
    }
  }
`

export type EditBillingEntityTimezoneDialogRef = DialogRef

interface EditBillingEntityTimezoneProps {
  id?: string
  timezone?: TimezoneEnum | null
}

export const EditBillingEntityTimezoneDialog = forwardRef<
  EditBillingEntityTimezoneDialogRef,
  EditBillingEntityTimezoneProps
>(({ id, timezone }: EditBillingEntityTimezoneProps, ref) => {
  const { translate } = useInternationalization()
  const [update] = useUpdateBillingEntityTimezoneMutation({
    onCompleted(res) {
      if (res?.updateBillingEntity) {
        addToast({
          severity: 'success',
          translateKey: 'text_63891ad3dd238c657ea00954',
        })
        Settings.defaultZone = getTimezoneConfig(res?.updateBillingEntity?.timezone).name
      }
    },
  })
  const formikProps = useFormik({
    initialValues: {
      timezone,
    },
    validationSchema: object().shape({
      timezone: string().nullable(),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: async ({ timezone: tzFromFormik, ...values }) => {
      const selectedTimezone = tzFromFormik || TimezoneEnum.TzUtc

      await update({
        variables: {
          input: {
            id: id as string,
            timezone: selectedTimezone,
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
      <div className="mb-8">
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
      </div>
    </Dialog>
  )
})

EditBillingEntityTimezoneDialog.displayName = 'EditBillingEntityTimezoneDialog'
