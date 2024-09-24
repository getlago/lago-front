import { useFormik } from 'formik'
import { forwardRef, RefObject, useId, useImperativeHandle, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { boolean, object, string } from 'yup'

import { Alert, Button, Chip, Dialog, DialogRef, Typography } from '~/components/designSystem'
import { Checkbox, CheckboxField, ComboBoxField, TextInputField } from '~/components/form'
import { DeleteHubspotIntegrationDialogRef } from '~/components/settings/integrations/DeleteHubspotIntegrationDialog'
import { envGlobalVar } from '~/core/apolloClient'
import { CreateHubspotIntegrationInput, TargetedObjectsEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { tw } from '~/styles/utils'

type TAddHubspotDialogProps = Partial<{
  deleteModalRef: RefObject<DeleteHubspotIntegrationDialogRef>
  provider: any
  deleteDialogCallback: Function
}>

export interface AddHubspotDialogRef {
  openDialog: (props?: TAddHubspotDialogProps) => unknown
  closeDialog: () => unknown
}

export const AddHubspotDialog = forwardRef<AddHubspotDialogRef>((_, ref) => {
  const componentId = useId()
  const { nangoPublicKey } = envGlobalVar()

  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const dialogRef = useRef<DialogRef>(null)
  const [localData, setLocalData] = useState<TAddHubspotDialogProps | undefined>(undefined)
  const [showGlobalError, setShowGlobalError] = useState(false)
  const hubspotProvider = localData?.provider
  const isEdition = !!hubspotProvider

  const formikProps = useFormik<Omit<CreateHubspotIntegrationInput, 'connectionId'>>({
    initialValues: {
      name: hubspotProvider?.name || '',
      code: hubspotProvider?.code || '',
      defaultTargetedObject:
        hubspotProvider?.defaultTargetedObject || TargetedObjectsEnum.Companies,
      privateAppToken: hubspotProvider?.privateAppToken || '',
      syncInvoices: !!hubspotProvider?.syncInvoices,
      syncSubscriptions: !!hubspotProvider?.syncSubscriptions,
    },
    validationSchema: object().shape({
      name: string().required(''),
      code: string().required(''),
      defaultTargetedObject: string().required(''),
      privateAppToken: string().required(''),
      syncInvoices: boolean(),
      syncSubscriptions: boolean(),
    }),
    onSubmit: async ({ ...values }) => {
      setShowGlobalError(false)

      console.log({ values })

      dialogRef.current?.closeDialog()
    },
    validateOnMount: true,
    enableReinitialize: true,
  })

  useImperativeHandle(ref, () => ({
    openDialog: (data) => {
      setLocalData(data)
      dialogRef.current?.openDialog()
    },
    closeDialog: () => dialogRef.current?.closeDialog(),
  }))

  return (
    <Dialog
      ref={dialogRef}
      title={translate(
        isEdition ? 'text_661ff6e56ef7e1b7c542b1d0' : 'text_1727189568053ifu63v2q1gf',
        {
          name: hubspotProvider?.name,
        },
      )}
      description={translate(
        isEdition ? 'text_1727189568053fu2g4sonout' : 'text_1727189568054z4qhm7flfgh',
      )}
      onClose={formikProps.resetForm}
      actions={({ closeDialog }) => (
        <div
          className={tw('flex flex-row items-center justify-between gap-3', isEdition && 'w-full')}
        >
          {isEdition && (
            <Button
              danger
              variant="quaternary"
              onClick={() => {
                closeDialog()
                localData?.deleteModalRef?.current?.openDialog({
                  provider: hubspotProvider,
                  callback: localData.deleteDialogCallback,
                })
              }}
            >
              {translate('text_65845f35d7d69c3ab4793dad')}
            </Button>
          )}
          <div className="flex flex-row items-center gap-3">
            <Button variant="quaternary" onClick={closeDialog}>
              {translate('text_63eba8c65a6c8043feee2a14')}
            </Button>
            <Button
              variant="primary"
              disabled={!formikProps.isValid || !formikProps.dirty}
              onClick={formikProps.submitForm}
            >
              {translate(
                isEdition ? 'text_65845f35d7d69c3ab4793dac' : 'text_1727189568053ifu63v2q1gf',
              )}
            </Button>
          </div>
        </div>
      )}
    >
      <div className="mb-8 flex w-full flex-col gap-8">
        {!!showGlobalError && (
          <Alert type="danger">{translate('text_62b31e1f6a5b8b1b745ece48')}</Alert>
        )}

        <div className="flex w-full flex-row items-start gap-6 *:flex-1">
          <TextInputField
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={!isEdition}
            name="name"
            label={translate('text_6419c64eace749372fc72b0f')}
            placeholder={translate('text_6584550dc4cec7adf861504f')}
            formikProps={formikProps}
          />
          <TextInputField
            name="code"
            beforeChangeFormatter="code"
            label={translate('text_62876e85e32e0300e1803127')}
            placeholder={translate('text_6584550dc4cec7adf8615053')}
            formikProps={formikProps}
          />
        </div>

        <TextInputField
          name="privateAppToken"
          label={translate('text_1727189568054lp1npj548nk')}
          placeholder={translate('text_172718956805412kz5w7o2m2')}
          formikProps={formikProps}
        />

        <div className="flex flex-col gap-12">
          <ComboBoxField
            name="defaultTargetedObject"
            label={translate('text_17271895680545qv3cvwk1jx')}
            formikProps={formikProps}
            data={[
              {
                label: translate('text_1727190044775zgd0l3fpwdj'),
                value: TargetedObjectsEnum.Companies,
              },
              {
                label: translate('text_1727190044775keiwznwv16s'),
                value: TargetedObjectsEnum.Contacts,
              },
            ]}
            PopperProps={{ displayInDialog: true }}
          />

          <div className="flex flex-col gap-4">
            <div>
              <Typography variant="bodyHl" color="grey700">
                {translate('text_1727190044775k62adpax08b')}
              </Typography>
              <Typography variant="caption" color="grey600">
                {translate('text_661ff6e56ef7e1b7c542b28e')}
              </Typography>
            </div>

            <Checkbox
              disabled
              label={
                <CheckboxLabelWithCode
                  firstPart={translate('text_1727190044775yssj1flnpe9')}
                  code="Company"
                  lastPart={translate('text_1727190044775p6mbfwbzv36')}
                />
              }
              value={true}
            />

            <Checkbox
              disabled
              label={
                <CheckboxLabelWithCode
                  firstPart={translate('text_1727190044775yssj1flnpe9')}
                  code="Contacts"
                  lastPart={translate('text_1727190044775p6mbfwbzv36')}
                />
              }
              value={true}
            />

            <CheckboxField
              name="syncInvoices"
              formikProps={formikProps}
              label={
                <CheckboxLabelWithCode
                  firstPart={translate('text_1727190044775yssj1flnpe9')}
                  code="LagoInvoices"
                  lastPart={translate('text_172719004477572tu71psqqt')}
                />
              }
            />
            <CheckboxField
              name="syncSubscriptions"
              formikProps={formikProps}
              label={
                <CheckboxLabelWithCode
                  firstPart={translate('text_1727190044775yssj1flnpe9')}
                  code="LagoSubscriptions"
                  lastPart={translate('text_172719004477572tu71psqqt')}
                />
              }
            />
          </div>
        </div>
      </div>
    </Dialog>
  )
})

const CheckboxLabelWithCode = ({
  firstPart,
  code,
  lastPart,
}: {
  firstPart: string
  code: string
  lastPart: string
}) => {
  return (
    <div className="flex flex-row flex-wrap items-center gap-1">
      <Typography variant="body" color="grey700">
        {firstPart}
      </Typography>
      <Chip size="small" label={code} color="danger600" />
      <Typography variant="body" color="grey700">
        {lastPart}
      </Typography>
    </div>
  )
}

AddHubspotDialog.displayName = 'AddHubspotDialog'
