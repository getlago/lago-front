import { revalidateLogic, useStore } from '@tanstack/react-form'
import { useEffect, useRef, useState } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import NameAndCodeGroup from '~/components/form/NameAndCodeGroup/NameAndCodeGroup'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import {
  PreviewCustomSectionDrawer,
  PreviewCustomSectionDrawerRef,
} from '~/components/settings/invoices/PreviewCustomSectionDrawer'
import { FORM_ERRORS_ENUM } from '~/core/constants/form'
import { INVOICE_SETTINGS_ROUTE, useNavigate } from '~/core/router'
import { scrollToTop } from '~/core/utils/domUtils'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useCreateEditInvoiceCustomSection } from '~/hooks/useCreateEditInvoiceCustomSection'
import { FormLoadingSkeleton } from '~/styles/mainObjectsForm'

import {
  createCustomSectionValidationSchema,
  CreateCustomSectionValues,
} from './createCustomSection/validationSchema'

export const CREATE_CUSTOM_SECTION_FORM_ID = 'create-custom-section-form'

const CreateInvoiceCustomSection = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()

  const centralizedDialog = useCentralizedDialog()
  const previewCustomSectionDrawerRef = useRef<PreviewCustomSectionDrawerRef>(null)

  const { loading, isEdition, invoiceCustomSection, onSave, errorCode } =
    useCreateEditInvoiceCustomSection()

  const openDirtyAttributesWarning = () =>
    centralizedDialog.open({
      title: translate('text_6244277fe0975300fe3fb940'),
      description: translate('text_6244277fe0975300fe3fb946'),
      actionText: translate('text_6244277fe0975300fe3fb94c'),
      colorVariant: 'danger',
      onAction: () => navigate(INVOICE_SETTINGS_ROUTE),
    })

  const form = useAppForm({
    defaultValues: {
      name: invoiceCustomSection?.name || '',
      code: invoiceCustomSection?.code || '',
      description: invoiceCustomSection?.description || '',
      displayName: invoiceCustomSection?.displayName || '',
      details: invoiceCustomSection?.details || '',
    } as CreateCustomSectionValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: createCustomSectionValidationSchema,
    },
    onSubmit: async ({ value }) => {
      onSave(value)
    },
  })

  useEffect(() => {
    if (invoiceCustomSection) {
      form.reset({
        name: invoiceCustomSection.name || '',
        code: invoiceCustomSection.code || '',
        description: invoiceCustomSection.description || '',
        displayName: invoiceCustomSection.displayName || '',
        details: invoiceCustomSection.details || '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceCustomSection])

  const isDirty = useStore(form.store, (state) => state.isDirty)

  const [shouldDisplayDescription, setShouldDisplayDescription] = useState(
    !!invoiceCustomSection?.description,
  )

  useEffect(() => {
    setShouldDisplayDescription(!!invoiceCustomSection?.description)
  }, [invoiceCustomSection?.description])

  useEffect(() => {
    if (errorCode === FORM_ERRORS_ENUM.existingCode) {
      form.setFieldMeta('code', (meta) => ({
        ...meta,
        errorMap: {
          ...meta.errorMap,
          onDynamic: { message: 'text_632a2d437e341dcc76817556' },
        },
      }))
      scrollToTop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorCode])

  const codeValue = useStore(form.store, (state) => state.values.code)

  useEffect(() => {
    if (errorCode === FORM_ERRORS_ENUM.existingCode) {
      form.setFieldMeta('code', (meta) => ({
        ...meta,
        errorMap: { ...meta.errorMap, onDynamic: undefined },
      }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codeValue])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    form.handleSubmit()
  }

  return (
    <>
      <CenteredPage.Wrapper>
        <form
          id={CREATE_CUSTOM_SECTION_FORM_ID}
          className="flex min-h-full flex-col"
          onSubmit={handleSubmit}
        >
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
                isDirty ? openDirtyAttributesWarning() : navigate(INVOICE_SETTINGS_ROUTE)
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
                  <Typography variant="body">
                    {translate('text_1732553358445p7rg0i0dzws')}
                  </Typography>
                </div>

                <div className="flex flex-col gap-12 not-last-child:pb-12 not-last-child:shadow-b">
                  <section className="not-last-child:mb-6">
                    <div className="not-last-child:mb-2">
                      <Typography variant="subhead1">
                        {translate('text_1732553358445sjgzrnstueo')}
                      </Typography>
                      <Typography variant="caption">
                        {translate('text_17325533584451rema9e6rs5')}
                      </Typography>
                    </div>
                    <NameAndCodeGroup
                      form={form}
                      fields={{ name: 'name', code: 'code' }}
                      disableAutoGenerateCode={isEdition}
                      nameProps={{
                        autoFocus: true,
                        label: translate('text_6419c64eace749372fc72b0f'),
                        placeholder: translate('text_6584550dc4cec7adf861504f'),
                      }}
                      codeProps={{
                        label: translate('text_62876e85e32e0300e1803127'),
                        placeholder: translate('text_6584550dc4cec7adf8615053'),
                      }}
                    />
                    {shouldDisplayDescription ? (
                      <div className="flex items-center gap-2">
                        <form.AppField name="description">
                          {(field) => (
                            <field.TextInputField
                              className="flex-1"
                              label={translate('text_623b42ff8ee4e000ba87d0c8')}
                              placeholder={translate('text_1750257831368ae3rtaclhjy')}
                              rows="3"
                              multiline
                            />
                          )}
                        </form.AppField>

                        <Tooltip
                          placement="top-end"
                          title={translate('text_63aa085d28b8510cd46443ff')}
                        >
                          <Button
                            icon="trash"
                            variant="quaternary"
                            onClick={() => {
                              form.setFieldValue('description', '')
                              setShouldDisplayDescription(false)
                            }}
                          />
                        </Tooltip>
                      </div>
                    ) : (
                      <Button
                        startIcon="plus"
                        variant="inline"
                        onClick={() => setShouldDisplayDescription(true)}
                        data-test="show-description"
                      >
                        {translate('text_642d5eb2783a2ad10d670324')}
                      </Button>
                    )}
                  </section>

                  <section className="not-last-child:mb-6">
                    <div className="not-last-child:mb-2">
                      <Typography variant="subhead1">
                        {translate('text_1732553358445ia697d93gbj')}
                      </Typography>
                      <Typography variant="caption">
                        {translate('text_1732553358445diim0lbo5nl')}
                      </Typography>
                    </div>
                    <form.AppField name="displayName">
                      {(field) => (
                        <field.TextInputField
                          label={translate('text_65018c8e5c6b626f030bcf26')}
                          placeholder={translate('text_65a6b4e2cb38d9b70ec53d41')}
                        />
                      )}
                    </form.AppField>
                    <form.AppField name="details">
                      {(field) => (
                        <field.TextInputField
                          label={translate('text_1732553358445fhl5zibpn2l')}
                          placeholder={translate('text_1732553358446t0zh79g9ruk')}
                          rows="3"
                          multiline
                        />
                      )}
                    </form.AppField>
                    <Button
                      startIcon="eye"
                      variant="quaternary"
                      onClick={() =>
                        previewCustomSectionDrawerRef.current?.openDrawer({
                          displayName: form.state.values.displayName,
                          details: form.state.values.details,
                        })
                      }
                    >
                      {translate('text_173255335844629sa49oljif')}
                    </Button>
                  </section>
                </div>
              </>
            )}
          </CenteredPage.Container>

          <CenteredPage.StickyFooter>
            <Button
              variant="quaternary"
              onClick={() =>
                isDirty ? openDirtyAttributesWarning() : navigate(INVOICE_SETTINGS_ROUTE)
              }
            >
              {translate('text_6411e6b530cb47007488b027')}
            </Button>
            <form.AppForm>
              <form.SubmitButton>
                {isEdition
                  ? translate('text_17295436903260tlyb1gp1i7')
                  : translate('text_17325538899488ftsvph8ko5')}
              </form.SubmitButton>
            </form.AppForm>
          </CenteredPage.StickyFooter>
        </form>
      </CenteredPage.Wrapper>

      <PreviewCustomSectionDrawer ref={previewCustomSectionDrawerRef} />
    </>
  )
}

export default CreateInvoiceCustomSection
