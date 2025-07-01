import { useFormik } from 'formik'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'
import { object } from 'yup'

import { Button, Card, Drawer, DrawerRef, Typography } from '~/components/designSystem'
import { JsonEditor } from '~/components/form'
import { customShape } from '~/formValidation/chargeSchema'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { DrawerContent, DrawerSubmitButton, DrawerTitle } from '~/styles'

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
      title={translate('text_663dea5702b60301d8d0646e')}
      onClose={() => {
        formikProps.resetForm()
        formikProps.validateForm()
        drawerRef.current?.closeDrawer()
      }}
    >
      <DrawerContent className="grid h-full grid-rows-[auto,1fr,auto]">
        <DrawerTitle>
          <Typography variant="headline">{translate('text_663dea5702b60301d8d0646e')}</Typography>
          <Typography>{translate('text_663dea5702b60301d8d064fe')}</Typography>
        </DrawerTitle>

        <Card>
          <Typography variant="subhead1">{translate('text_663dea5702b60301d8d06502')}</Typography>
          <JsonEditor
            hideLabel
            label={translate('text_663dea5702b60301d8d06502')}
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
            disabled={!formikProps.isValid || !formikProps.dirty}
            loading={formikProps.isSubmitting}
            onClick={async () => {
              await formikProps.submitForm()
              drawerRef.current?.closeDrawer()
            }}
          >
            {translate('text_663dea5702b60301d8d06490')}
          </Button>
        </DrawerSubmitButton>
      </DrawerContent>
    </Drawer>
  )
})

EditCustomChargeDrawer.displayName = 'EditCustomChargeDrawer'
