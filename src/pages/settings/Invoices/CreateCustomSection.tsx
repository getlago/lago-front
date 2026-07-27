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
export const CREATE_CUSTOM_SECTION_CLOSE_BUTTON_TEST_ID = 'create-custom-section-close-button'
export const CREATE_CUSTOM_SECTION_CANCEL_BUTTON_TEST_ID = 'create-custom-section-cancel-button'
export const CREATE_CUSTOM_SECTION_SUBMIT_BUTTON_TEST_ID = 'create-custom-section-submit-button'
export const CREATE_CUSTOM_SECTION_DESCRIPTION_INPUT_TEST_ID =
  'create-custom-section-description-input'
export const CREATE_CUSTOM_SECTION_DESCRIPTION_DELETE_TEST_ID =
  'create-custom-section-description-delete-button'
export const CREATE_CUSTOM_SECTION_SHOW_DESCRIPTION_BUTTON_TEST_ID = 'show-description'
export const CREATE_CUSTOM_SECTION_DISPLAY_NAME_INPUT_TEST_ID =
  'create-custom-section-display-name-input'
export const CREATE_CUSTOM_SECTION_DETAILS_INPUT_TEST_ID = 'create-custom-section-details-input'
export const CREATE_CUSTOM_SECTION_PREVIEW_BUTTON_TEST_ID = 'create-custom-section-preview-button'

// Server "code already exists" error. Written into the code field's `onSubmit`
// errorMap slot (not `onDynamic`, which the Zod validator owns and periodically
// recomputes, silently wiping any manual value written there) and cleared only
// when it's still the message we set, so a Zod validation error is never wiped.
const EXISTING_CODE_ERROR_MESSAGE = 'text_632a2d437e341dcc76817556'

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

  const defaultValues: CreateCustomSectionValues = {
    name: invoiceCustomSection?.name || '',
    code: invoiceCustomSection?.code || '',
    description: invoiceCustomSection?.description || '',
    displayName: invoiceCustomSection?.displayName || '',
    details: invoiceCustomSection?.details || '',
  }

  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: createCustomSectionValidationSchema,
    },
    onSubmit: async ({ value }) => {
      await onSave(value)
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
          onSubmit: { message: EXISTING_CODE_ERROR_MESSAGE },
        },
      }))
      scrollToTop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorCode])

  const codeValue = useStore(form.store, (state) => state.values.code)
  const isFirstCodeValueRender = useRef(true)

  useEffect(() => {
    // Skip the mount-time run: `codeValue`'s first effect fires alongside the
    // errorCode effect above (both deps get their initial value on the same
    // mount), which would otherwise immediately clear the error we just set.
    if (isFirstCodeValueRender.current) {
      isFirstCodeValueRender.current = false
      return
    }

    // Only clear our own server error, keyed under its own `onSubmit` errorMap
    // slot so it's never wiped by the Zod validator's `onDynamic` revalidation.
    const meta = form.getFieldMeta('code')

    if (meta?.errorMap?.onSubmit?.message !== EXISTING_CODE_ERROR_MESSAGE) return

    form.setFieldMeta('code', (current) => ({
      ...current,
      errorMap: { ...current.errorMap, onSubmit: undefined },
    }))
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
              data-test={CREATE_CUSTOM_SECTION_CLOSE_BUTTON_TEST_ID}
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
                              data-test={CREATE_CUSTOM_SECTION_DESCRIPTION_INPUT_TEST_ID}
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
                            data-test={CREATE_CUSTOM_SECTION_DESCRIPTION_DELETE_TEST_ID}
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
                        data-test={CREATE_CUSTOM_SECTION_SHOW_DESCRIPTION_BUTTON_TEST_ID}
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
                          data-test={CREATE_CUSTOM_SECTION_DISPLAY_NAME_INPUT_TEST_ID}
                          label={translate('text_65018c8e5c6b626f030bcf26')}
                          placeholder={translate('text_65a6b4e2cb38d9b70ec53d41')}
                        />
                      )}
                    </form.AppField>
                    <form.AppField name="details">
                      {(field) => (
                        <field.TextInputField
                          data-test={CREATE_CUSTOM_SECTION_DETAILS_INPUT_TEST_ID}
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
                      data-test={CREATE_CUSTOM_SECTION_PREVIEW_BUTTON_TEST_ID}
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
              data-test={CREATE_CUSTOM_SECTION_CANCEL_BUTTON_TEST_ID}
              onClick={() =>
                isDirty ? openDirtyAttributesWarning() : navigate(INVOICE_SETTINGS_ROUTE)
              }
            >
              {translate('text_6411e6b530cb47007488b027')}
            </Button>
            <form.AppForm>
              <form.SubmitButton dataTest={CREATE_CUSTOM_SECTION_SUBMIT_BUTTON_TEST_ID}>
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
