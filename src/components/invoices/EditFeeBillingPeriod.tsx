import { useFormik } from 'formik'
import { DateTime } from 'luxon'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { object, string } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { DatePicker } from '~/components/form'
import { dateErrorCodes } from '~/core/constants/form'
import { getTimezoneConfig } from '~/core/timezone'
import { TimezoneEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type EditFeeBillingPeriodProps = {
  fromDatetime: string
  toDatetime: string
  callback: (fromDatetime: string, toDatetime: string) => void
}

export interface EditFeeBillingPeriodRef {
  openDialog: (data: EditFeeBillingPeriodProps) => unknown
  closeDialog: () => unknown
}

export const EditFeeBillingPeriod = forwardRef<EditFeeBillingPeriodRef>((_, ref) => {
  const { translate } = useInternationalization()
  const dialogRef = useRef<DialogRef>(null)
  const [data, setData] = useState<EditFeeBillingPeriodProps>()

  const formikProps = useFormik<Omit<EditFeeBillingPeriodProps, 'callback'>>({
    initialValues: {
      fromDatetime: data?.fromDatetime || '',
      toDatetime: data?.toDatetime || '',
    },
    validationSchema: object().shape({
      fromDatetime: string().required(''),
      toDatetime: string().test({
        test: function (value, { from, path }) {
          // Value can be undefined
          if (!value) {
            return true
          }

          // Make sure value has correct format
          if (!DateTime.fromISO(value).isValid) {
            return this.createError({
              path,
              message: dateErrorCodes.wrongFormat,
            })
          }

          // If subscription at is present
          if (from?.[0]?.value?.fromDatetime) {
            const fromDatetime = DateTime.fromISO(from[0].value.fromDatetime)
            const toDatetime = DateTime.fromISO(value)

            // Make sure endingAt is set later than subscriptionAt
            if (toDatetime <= fromDatetime) {
              return this.createError({
                path,
                message: dateErrorCodes.shouldBeFutureAndBiggerThanFromDatetime,
              })
            }
          }

          return true
        },
      }),
    }),
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: async (values, formikBag) => {
      data?.callback(values.fromDatetime || '', values.toDatetime || '')

      dialogRef?.current?.closeDialog()
      formikBag.resetForm()
    },
  })

  useImperativeHandle(ref, () => ({
    openDialog: (datas) => {
      setData(datas)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  return (
    <Dialog
      ref={dialogRef}
      title={translate('text_1754596547718sagqs9n5z2w')}
      description={translate('text_1754596547719py3gxrwmgdo')}
      onClose={() => {
        formikProps.resetForm()
        formikProps.validateForm()
      }}
      actions={({ closeDialog }) => (
        <>
          <Button variant="quaternary" onClick={closeDialog}>
            {translate('text_63eba8c65a6c8043feee2a14')}
          </Button>
          <Button
            variant="primary"
            disabled={!formikProps.isValid || !formikProps.dirty}
            onClick={async () => {
              await formikProps.submitForm()
              closeDialog()
            }}
          >
            {translate('text_17295436903260tlyb1gp1i7')}
          </Button>
        </>
      )}
    >
      <div className="mb-8 flex items-start gap-6 [&>*]:flex-1">
        <DatePicker
          name="fromDatetime"
          label={translate('text_1754596347194ycmhkuol77d')}
          defaultZone={getTimezoneConfig(TimezoneEnum.TzUtc).name}
          value={formikProps.values.fromDatetime}
          onChange={(value) => {
            // value should be start of day
            formikProps.setFieldValue(
              'fromDatetime',
              value ? DateTime.fromISO(value).startOf('day').toISO() : '',
            )
          }}
        />
        <DatePicker
          name="toDatetime"
          label={translate('text_1754596347194hgyj8fzogqm')}
          defaultZone={getTimezoneConfig(TimezoneEnum.TzUtc).name}
          value={formikProps.values.toDatetime}
          error={
            formikProps.errors.toDatetime === dateErrorCodes.shouldBeFutureAndBiggerThanFromDatetime
              ? translate('text_175459724137023yixxoovqg')
              : undefined
          }
          onChange={(value) => {
            formikProps.setFieldValue(
              'toDatetime',
              value ? DateTime.fromISO(value).endOf('day').toISO() : '',
            )
          }}
        />
      </div>
    </Dialog>
  )
})

EditFeeBillingPeriod.displayName = 'forwardRef'
