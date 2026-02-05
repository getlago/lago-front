import { useFormik } from 'formik'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { boolean, object } from 'yup'

import { Button, Dialog, DialogRef } from '~/components/designSystem'
import { RadioGroupField } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type ImpactOverridenSubscriptionsDialogProps = {
  onSave: (value: boolean) => void
}

export type ImpactOverridenSubscriptionsDialogRef = {
  openDialog: ({ onSave }: ImpactOverridenSubscriptionsDialogProps) => void
  closeDialog: () => void
}

export const ImpactOverridenSubscriptionsDialog = forwardRef<ImpactOverridenSubscriptionsDialogRef>(
  (_, ref) => {
    const { translate } = useInternationalization()
    const dialogRef = useRef<DialogRef>(null)
    const [localData, setLocalData] = useState<ImpactOverridenSubscriptionsDialogProps>()

    const formikProps = useFormik<{ cascadeUpdates: boolean }>({
      initialValues: {
        cascadeUpdates: false,
      },
      validateOnMount: true,
      enableReinitialize: true,
      validationSchema: object().shape({
        cascadeUpdates: boolean().required(),
      }),
      onSubmit: async (values) => {
        localData?.onSave?.(values.cascadeUpdates)

        dialogRef?.current?.closeDialog()
      },
    })

    useImperativeHandle(ref, () => ({
      openDialog: (data) => {
        formikProps.resetForm()
        setLocalData(data)
        dialogRef.current?.openDialog()
      },
      closeDialog: () => {
        setLocalData(undefined)
        dialogRef.current?.closeDialog()
      },
    }))

    return (
      <Dialog
        ref={dialogRef}
        title={translate('text_1729604107534r3hsj7i64gp')}
        description={translate('text_17296041075348k56saczddu')}
        actions={({ closeDialog }) => (
          <div className="mt-8 flex gap-3">
            <Button variant="quaternary" onClick={closeDialog}>
              {translate('text_6271200984178801ba8bdf4a')}
            </Button>

            <Button variant="primary" onClick={formikProps.submitForm}>
              {translate('text_1729604107534dfyz8j53ho5')}
            </Button>
          </div>
        )}
      >
        <RadioGroupField
          name="cascadeUpdates"
          formikProps={formikProps}
          optionsGapSpacing={4}
          optionLabelVariant="body"
          options={[
            {
              label: translate('text_17296041075346803c5xv8um'),
              sublabel: translate('text_1729604107534v8b3vembdla'),
              value: false,
            },
            {
              label: translate('text_1729604107534vznb0h27kje'),
              sublabel: translate('text_1729604107534rrec9gxuh54'),
              value: true,
            },
          ]}
        />
      </Dialog>
    )
  },
)

ImpactOverridenSubscriptionsDialog.displayName = 'ImpactOverridenSubscriptionsDialog'
