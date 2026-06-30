import { useStore } from '@tanstack/react-form'
import { forwardRef, useImperativeHandle } from 'react'

import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { InvoiceCustomSectionFields } from '~/components/invoceCustomFooter/InvoiceCustomSectionFields'
import { InvoiceCustomSectionInput } from '~/components/invoceCustomFooter/types'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { ViewTypeEnum } from '~/components/paymentMethodsInvoiceSettings/types'
import { SubscriptionInvoiceConsolidationSection } from '~/components/subscriptions/SubscriptionInvoiceConsolidationSection'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm, withForm } from '~/hooks/forms/useAppform'

const INVOICING_SETTINGS_FORM_ID = 'invoicing-settings-drawer-form'

export interface InvoicingSettingsValues {
  consolidateInvoice: boolean
  invoiceCustomSection: InvoiceCustomSectionInput
}

const DEFAULT_VALUES: InvoicingSettingsValues = {
  consolidateInvoice: true,
  invoiceCustomSection: { invoiceCustomSections: [], skipInvoiceCustomSections: false },
}

interface InvoicingSettingsDrawerContentExtraProps {
  viewType: ViewTypeEnum
  customerId?: string
  showCustomSection: boolean
}

const invoicingSettingsDrawerContentDefaultProps: InvoicingSettingsDrawerContentExtraProps = {
  viewType: ViewTypeEnum.Subscription,
  customerId: undefined,
  showCustomSection: false,
}

const InvoicingSettingsDrawerContent = withForm({
  defaultValues: DEFAULT_VALUES,
  props: invoicingSettingsDrawerContentDefaultProps,
  render: function InvoicingSettingsDrawerContentRender({
    form,
    viewType,
    customerId,
    showCustomSection,
  }) {
    const { translate } = useInternationalization()
    // Reactive slice so the inline custom-section selector re-renders on edit.
    const invoiceCustomSection = useStore(form.store, (s) => s.values.invoiceCustomSection)

    return (
      <CenteredPage.PageSection>
        <CenteredPage.PageSectionTitle
          title={translate('text_17423672025282dl7iozy1ru')}
          description={translate('text_1782738644346p066xtwa8yj')}
        />

        <CenteredPage.SubsectionWrapper>
          <SubscriptionInvoiceConsolidationSection
            form={form}
            fields={{ consolidateInvoice: 'consolidateInvoice' }}
          />

          {showCustomSection && customerId && (
            <InvoiceCustomSectionFields
              viewType={viewType}
              customerId={customerId}
              value={invoiceCustomSection}
              onChange={(value) => form.setFieldValue('invoiceCustomSection', value)}
            />
          )}
        </CenteredPage.SubsectionWrapper>
      </CenteredPage.PageSection>
    )
  },
})

export interface InvoicingSettingsDrawerRef {
  openDrawer: (values: {
    consolidateInvoice: boolean
    invoiceCustomSection?: InvoiceCustomSectionInput | null
  }) => void
  closeDrawer: () => void
}

interface InvoicingSettingsDrawerProps {
  viewType: ViewTypeEnum
  customerId?: string
  showCustomSection: boolean
  onSave: (values: InvoicingSettingsValues) => void
}

// Invoicing settings drawer for the subscription form: holds a local draft of
// `consolidateInvoice` + `invoiceCustomSection` (seeded on open from the parent
// form) and commits it back through `onSave` on "Save edits". Mirrors the
// FixedChargeDrawer local-draft pattern — no live binding to the parent form.
export const InvoicingSettingsDrawer = forwardRef<
  InvoicingSettingsDrawerRef,
  InvoicingSettingsDrawerProps
>(({ viewType, customerId, showCustomSection, onSave }, ref) => {
  const { translate } = useInternationalization()
  const drawer = useFormDrawer()

  const form = useAppForm({
    defaultValues: DEFAULT_VALUES,
    onSubmit: async ({ value }) => {
      onSave({
        consolidateInvoice: value.consolidateInvoice,
        invoiceCustomSection: value.invoiceCustomSection,
      })
      drawer.close()
    },
  })

  const openInvoicingSettingsDrawer = (): void => {
    drawer.open({
      title: translate('text_17423672025282dl7iozy1ru'),
      form: { id: INVOICING_SETTINGS_FORM_ID, submit: form.handleSubmit },
      closeOnSubmitSuccess: false,
      shouldPromptOnClose: () => form.state.isDirty,
      onClose: () => form.reset(),
      onEntered: (container) => focusFirstInput(container),
      children: (
        <InvoicingSettingsDrawerContent
          form={form}
          viewType={viewType}
          customerId={customerId}
          showCustomSection={showCustomSection}
        />
      ),
      mainAction: (
        <form.AppForm>
          <form.SubmitButton dataTest="invoicing-settings-drawer-save">
            {translate('text_17295436903260tlyb1gp1i7')}
          </form.SubmitButton>
        </form.AppForm>
      ),
    })
  }

  useImperativeHandle(ref, () => ({
    openDrawer: (values) => {
      form.reset(
        {
          consolidateInvoice: values.consolidateInvoice,
          invoiceCustomSection: values.invoiceCustomSection ?? DEFAULT_VALUES.invoiceCustomSection,
        },
        { keepDefaultValues: true },
      )
      openInvoicingSettingsDrawer()
    },
    closeDrawer: () => {
      drawer.close()
    },
  }))

  return null
})

InvoicingSettingsDrawer.displayName = 'InvoicingSettingsDrawer'
