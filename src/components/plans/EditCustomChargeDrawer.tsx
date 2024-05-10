import { useFormik } from 'formik'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { object } from 'yup'

import { Button, Drawer, DrawerRef, Typography } from '~/components/designSystem'
import { JsonEditor } from '~/components/form'
import { customShape } from '~/formValidation/chargeSchema'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Card, DrawerContent, DrawerSubmitButton, DrawerTitle } from '~/styles'

type EditCustomChargeState = {
  customProperties: string | undefined
}

type EditCustomChargeDrawerProps = {
  onSubmit: (data: string) => void
}

export interface EditCustomChargeDrawerRef extends DrawerRef {
  openDrawer: (data?: EditCustomChargeState) => unknown
  closeDrawer: () => unknown
}

export const EditCustomChargeDrawer = forwardRef<
  EditCustomChargeDrawerRef,
  EditCustomChargeDrawerProps
>(({ onSubmit }, ref) => {
  const { translate } = useInternationalization()
  const drawerRef = useRef<DrawerRef>(null)

  const [localData, setLocalData] = useState<EditCustomChargeState['customProperties']>()

  const formikProps = useFormik<EditCustomChargeState>({
    initialValues: {
      customProperties: localData,
    },
    validationSchema: object().shape(customShape),
    validateOnMount: true,
    enableReinitialize: true,
    onSubmit: ({ customProperties }) => {
      if (customProperties) {
        onSubmit(customProperties)
        drawerRef.current?.closeDrawer()
      }
    },
  })

  useImperativeHandle(ref, () => ({
    openDrawer: (data) => {
      setLocalData(data?.customProperties)
      drawerRef.current?.openDrawer()
    },
    closeDrawer: () => drawerRef.current?.closeDrawer(),
  }))

  return (
    <Drawer
      ref={drawerRef}
      fullContentHeight
      title={translate('Edit custom price')}
      onClose={() => {
        formikProps.resetForm()
        drawerRef.current?.closeDrawer()
      }}
    >
      <DrawerContent style={{ height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr auto' }}>
        <DrawerTitle>
          <Typography variant="headline">{translate('Edit custom price')}</Typography>
          <Typography>
            {translate(
              'Define your custom pricing using a JSON file. For support, reach out to the Lago team.',
            )}
          </Typography>
        </DrawerTitle>

        <Card>
          <Typography variant="subhead">{translate('Custom price')}</Typography>
          <JsonEditor
            hideLabel
            label={translate('Custom price')}
            value={localData}
            onChange={(value) => {
              formikProps.setFieldValue('customProperties', value)
            }}
            error={formikProps.errors.customProperties}
            onError={(error) => formikProps.setFieldError('customProperties', error)}
            onBlur={() => formikProps.setFieldTouched('customProperties', true, false)}
          />
        </Card>

        <DrawerSubmitButton>
          <Button
            fullWidth
            size="large"
            disabled={!formikProps.isValid || !formikProps.isValid}
            loading={formikProps.isSubmitting}
            onClick={formikProps.submitForm}
          >
            {translate('Save custom pricing')}
          </Button>
        </DrawerSubmitButton>
      </DrawerContent>
    </Drawer>
  )
})

EditCustomChargeDrawer.displayName = 'EditCustomChargeDrawer'
