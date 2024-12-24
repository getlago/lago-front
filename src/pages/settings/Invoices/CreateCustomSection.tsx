import { useFormik } from 'formik'
import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { boolean, object, string } from 'yup'

import { Button, Tooltip, Typography } from '~/components/designSystem'
import { SwitchField, TextInputField } from '~/components/form'
import { CenteredPage } from '~/components/layouts/Pages'
import {
  DefaultCustomSectionDialog,
  DefaultCustomSectionDialogRef,
} from '~/components/settings/invoices/DefaultCustomSectionDialog'
import {
  PreviewCustomSectionDrawer,
  PreviewCustomSectionDrawerRef,
} from '~/components/settings/invoices/PreviewCustomSectionDrawer'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { INVOICE_SETTINGS_ROUTE } from '~/core/router'
import { CreateInvoiceCustomSectionInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCreateEditInvoiceCustomSection } from '~/hooks/useCreateEditInvoiceCustomSection'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

const CreateInvoiceCustomSection = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()

  const warningDirtyAttributesDialogRef = useRef<WarningDialogRef>(null)
  const defaultCustomSectionDialogRef = useRef<DefaultCustomSectionDialogRef>(null)
  const previewCustomSectionDrawerRef = useRef<PreviewCustomSectionDrawerRef>(null)

  const { loading, isEdition, invoiceCustomSection, onSave } = useCreateEditInvoiceCustomSection()

  const formikProps = useFormik<CreateInvoiceCustomSectionInput>({
    initialValues: {
      name: invoiceCustomSection?.name || '',
      code: invoiceCustomSection?.code || '',
      description: invoiceCustomSection?.description || '',
      displayName: invoiceCustomSection?.displayName || '',
      details: invoiceCustomSection?.details || '',
      selected: invoiceCustomSection?.selected || false,
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
      <CenteredPage.Wrapper>
        <CenteredPage.Header>
          <Typography variant="bodyHl" color="textSecondary" noWrap>
            {isEdition
              ? translate('text_1733841825248s6mxx67rsw7')
              : translate('text_1732553358445p5bxpiijc65')}
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
        </CenteredPage.Header>

        <CenteredPage.Container>
          {loading ? (
            <FormLoadingSkeleton id="create-custom-section" />
          ) : (
            <>
              <div className="not-last-child:mb-1">
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
                  <Button
                    startIcon="eye"
                    variant="quaternary"
                    onClick={() =>
                      previewCustomSectionDrawerRef.current?.openDrawer({
                        displayName: formikProps.values.displayName,
                        details: formikProps.values.details,
                      })
                    }
                  >
                    {translate('text_173255335844629sa49oljif')}
                  </Button>
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
            </>
          )}
        </CenteredPage.Container>

        <CenteredPage.StickyFooter>
          <Button
            variant="quaternary"
            size="large"
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
            size="large"
            disabled={!formikProps.isValid || !formikProps.dirty}
            onClick={onSubmit}
          >
            {isEdition
              ? translate('text_17295436903260tlyb1gp1i7')
              : translate('text_17325538899488ftsvph8ko5')}
          </Button>
        </CenteredPage.StickyFooter>
      </CenteredPage.Wrapper>

      <WarningDialog
        ref={warningDirtyAttributesDialogRef}
        title={translate('text_6244277fe0975300fe3fb940')}
        description={translate('text_6244277fe0975300fe3fb946')}
        continueText={translate('text_6244277fe0975300fe3fb94c')}
        onContinue={() => navigate(INVOICE_SETTINGS_ROUTE)}
      />
      <DefaultCustomSectionDialog ref={defaultCustomSectionDialogRef} />
      <PreviewCustomSectionDrawer ref={previewCustomSectionDrawerRef} />
    </>
  )
}

export default CreateInvoiceCustomSection
