import { useFormik } from 'formik'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { boolean, object, string } from 'yup'

import { Button, Skeleton, Tooltip, Typography } from '~/components/designSystem'
import { SwitchField, TextInputField } from '~/components/form'
import {
  DefaultCustomSectionDialog,
  DefaultCustomSectionDialogRef,
} from '~/components/settings/invoices/DefaultCustomSectionDialog'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { INVOICE_SETTINGS_ROUTE } from '~/core/router'
import { CreateInvoiceCustomSectionInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCreateEditInvoiceCustomSection } from '~/hooks/useCreateEditInvoiceCustomSection'
import { PageHeader } from '~/styles'

const CreateInvoiceCustomSection = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()

  const warningDirtyAttributesDialogRef = useRef<WarningDialogRef>(null)
  const defaultCustomSectionDialogRef = useRef<DefaultCustomSectionDialogRef>(null)

  const { loading, onSave } = useCreateEditInvoiceCustomSection()

  const formikProps = useFormik<CreateInvoiceCustomSectionInput>({
    initialValues: {
      name: '',
      code: '',
      description: '',
      displayName: '',
      details: '',
      selected: false,
    },
    validationSchema: object().shape({
      name: string().required(''),
      code: string().required(''),
      description: string(),
      displayName: string().when('details', {
        is: (details: string) => !details,
        then: (schema) => schema.required(''),
        otherwise: (schema) => schema.notRequired(),
      }),
      selected: boolean().required(''),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: async (values) => {
      onSave(values)
    },
  })

  const [shouldDisplayDescription, setShouldDisplayDescription] = useState(
    !!formikProps.initialValues.description,
  )

  const onSubmit = () => {
    if (!!formikProps.values.selected) {
      defaultCustomSectionDialogRef.current?.openDialog({
        type: 'setDefault',
        onConfirm: formikProps.submitForm,
        onCancel: () => formikProps.setFieldValue('selected', false),
      })
    } else {
      formikProps.submitForm()
    }
  }

  return (
    <>
      <div>
        <PageHeader>
          <Typography variant="bodyHl" color="textSecondary" noWrap>
            {translate('text_1732553358445168zt8fopyf')}
          </Typography>
          <Button
            variant="quaternary"
            icon="close"
            onClick={() =>
              formikProps.dirty
                ? warningDirtyAttributesDialogRef.current?.openDialog()
                : navigate(INVOICE_SETTINGS_ROUTE)
            }
          />
        </PageHeader>

        {loading ? (
          <div className="container mx-auto mb-15 mt-12 flex flex-col gap-12">
            <div>
              <Skeleton variant="text" className="mb-4 w-40" />
              <Skeleton variant="text" className="w-100" />
            </div>
            {[0, 1].map((_, index) => (
              <div key={`loading-${index}`}>
                <div className="flex flex-col gap-5 pb-12 shadow-b">
                  <Skeleton variant="text" className="w-40" />
                  <Skeleton variant="text" className="w-100" />
                  <Skeleton variant="text" className="w-74" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="container mx-auto min-h-[calc(100vh_-_theme(space.nav)_-_theme(space.footer))] pb-20 pt-12">
              <div className="mb-12 not-last-child:mb-1">
                <Typography variant="headline" color="textSecondary">
                  {translate('text_1732553358445168zt8fopyf')}
                </Typography>
                <Typography variant="body">{translate('text_1732553358445p7rg0i0dzws')}</Typography>
              </div>

              <div className="flex flex-col gap-12 not-last-child:pb-12 not-last-child:shadow-b">
                <section className="not-last-child:mb-6">
                  <div className="not-last-child:mb-2">
                    <Typography variant="subhead">
                      {translate('text_1732553358445sjgzrnstueo')}
                    </Typography>
                    <Typography variant="caption">
                      {translate('text_17325533584451rema9e6rs5')}
                    </Typography>
                  </div>
                  <div className="flex items-start gap-6 *:flex-1">
                    <TextInputField
                      name="name"
                      formikProps={formikProps}
                      label={translate('text_6419c64eace749372fc72b0f')}
                      placeholder={translate('text_6584550dc4cec7adf861504f')}
                    />
                    <TextInputField
                      name="code"
                      beforeChangeFormatter="code"
                      formikProps={formikProps}
                      label={translate('text_62876e85e32e0300e1803127')}
                      placeholder={translate('text_6584550dc4cec7adf8615053')}
                    />
                  </div>
                  {shouldDisplayDescription ? (
                    <div className="flex items-center gap-2">
                      <TextInputField
                        className="flex-1"
                        name="description"
                        label={translate('text_623b42ff8ee4e000ba87d0c8')}
                        placeholder={translate('text_1728584028187uqs16ra27ef')}
                        rows="3"
                        multiline
                        formikProps={formikProps}
                      />

                      <Tooltip
                        placement="top-end"
                        title={translate('text_63aa085d28b8510cd46443ff')}
                      >
                        <Button
                          icon="trash"
                          variant="quaternary"
                          onClick={() => {
                            formikProps.setFieldValue('description', '')
                            setShouldDisplayDescription(false)
                          }}
                        />
                      </Tooltip>
                    </div>
                  ) : (
                    <Button
                      startIcon="plus"
                      variant="quaternary"
                      onClick={() => setShouldDisplayDescription(true)}
                      data-test="show-description"
                    >
                      {translate('text_642d5eb2783a2ad10d670324')}
                    </Button>
                  )}
                </section>

                <section className="not-last-child:mb-6">
                  <div className="not-last-child:mb-2">
                    <Typography variant="subhead">
                      {translate('text_1732553358445ia697d93gbj')}
                    </Typography>
                    <Typography variant="caption">
                      {translate('text_1732553358445diim0lbo5nl')}
                    </Typography>
                  </div>
                  <TextInputField
                    name="displayName"
                    formikProps={formikProps}
                    label={translate('text_65018c8e5c6b626f030bcf26')}
                    placeholder={translate('text_65a6b4e2cb38d9b70ec53d41')}
                  />
                  <TextInputField
                    name="details"
                    formikProps={formikProps}
                    label={translate('text_1732553358445fhl5zibpn2l')}
                    placeholder={translate('text_1732553358446t0zh79g9ruk')}
                    rows="3"
                    multiline
                  />
                </section>

                <section className="not-last-child:mb-6">
                  <SwitchField
                    name="selected"
                    formikProps={formikProps}
                    label={translate('text_1732553889947h4iijpzflwj')}
                    subLabel={translate('text_1732553889948thkn4jonnyy')}
                  />
                </section>
              </div>
            </div>

            <footer className="sticky bottom-0 flex h-footer border border-grey-200 bg-white">
              <div className="container mx-auto flex h-full items-center justify-end">
                <div className="flex items-center gap-6">
                  <Button
                    variant="quaternary"
                    onClick={() =>
                      formikProps.dirty
                        ? warningDirtyAttributesDialogRef.current?.openDialog()
                        : navigate(INVOICE_SETTINGS_ROUTE)
                    }
                  >
                    {translate('text_6411e6b530cb47007488b027')}
                  </Button>
                  <Button
                    variant="primary"
                    disabled={!formikProps.isValid || !formikProps.dirty}
                    onClick={onSubmit}
                  >
                    {translate('text_17325538899488ftsvph8ko5')}
                  </Button>
                </div>
              </div>
            </footer>
          </>
        )}
      </div>

      <WarningDialog
        ref={warningDirtyAttributesDialogRef}
        title={translate('text_6244277fe0975300fe3fb940')}
        description={translate('text_6244277fe0975300fe3fb946')}
        continueText={translate('text_6244277fe0975300fe3fb94c')}
        onContinue={() => navigate(INVOICE_SETTINGS_ROUTE)}
      />
      <DefaultCustomSectionDialog ref={defaultCustomSectionDialogRef} />
    </>
  )
}

export default CreateInvoiceCustomSection
