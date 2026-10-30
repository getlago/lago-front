import { revalidateLogic, useStore } from '@tanstack/react-form'
import { z } from 'zod'

import { useFormDrawer } from '~/components/drawers/useDrawer'
import { focusFirstInput } from '~/components/drawers/useFocusTrap'
import { InvoiceCustomSectionFields } from '~/components/invoceCustomFooter/InvoiceCustomSectionFields'
import {
  deriveInvoiceCustomSectionBehavior,
  InvoiceCustomSectionBehavior,
  InvoiceCustomSectionInput,
} from '~/components/invoceCustomFooter/types'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import { PaymentTermFormContent } from '~/components/paymentTerms/PaymentTermFormContent'
import { PaymentTermFormValues, PaymentTermInheritedFrom } from '~/components/paymentTerms/types'
import { paymentTermFormValuesFromTerm } from '~/components/paymentTerms/utils'
import { addPaymentTermIssues } from '~/components/paymentTerms/validationSchema'
import { SubscriptionInvoiceConsolidationSection } from '~/components/subscriptions/SubscriptionInvoiceConsolidationSection'
import {
  VIEW_TYPE_INVOICING_CAPTION_KEYS,
  VIEW_TYPE_TRANSLATION_KEYS,
  ViewTypeEnum,
} from '~/core/constants/billingObjectViewTypes'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm, withForm } from '~/hooks/forms/useAppform'

const INVOICING_SETTINGS_FORM_ID = 'invoicing-settings-drawer-form'

const getInvoicingSettingsTitleKey = (viewType: ViewTypeEnum): string =>
  viewType === ViewTypeEnum.Contract
    ? 'text_1790018785008ooo50umu32v'
    : 'text_17423672025282dl7iozy1ru'

const CONTRACT_CONSOLIDATION_TRANSLATION_KEYS = {
  consolidateDescription: 'text_1790018785008uhq827nuzzz',
  isolateDescription: 'text_179001878500893b7nboyx9k',
}

interface InvoicingSettingsValues {
  consolidateInvoice: boolean
  invoiceCustomSection: InvoiceCustomSectionInput
  paymentTerm: PaymentTermFormValues
}

interface InvoicingSettingsFormValues extends InvoicingSettingsValues {
  invoiceCustomSectionBehavior: InvoiceCustomSectionBehavior
}

const DEFAULT_VALUES: InvoicingSettingsFormValues = {
  consolidateInvoice: true,
  invoiceCustomSection: { invoiceCustomSections: [], skipInvoiceCustomSections: false },
  invoiceCustomSectionBehavior: InvoiceCustomSectionBehavior.FALLBACK,
  paymentTerm: paymentTermFormValuesFromTerm(null, true),
}

const invoicingSettingsValidationSchema = z
  .object({
    consolidateInvoice: z.boolean(),
    invoiceCustomSection: z.custom<InvoiceCustomSectionInput>(),
    invoiceCustomSectionBehavior: z.enum(InvoiceCustomSectionBehavior),
    paymentTerm: z.custom<PaymentTermFormValues>(),
  })
  .superRefine((values, ctx) => {
    if (
      values.invoiceCustomSectionBehavior === InvoiceCustomSectionBehavior.APPLY &&
      values.invoiceCustomSection.invoiceCustomSections.length === 0
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['invoiceCustomSection'],
        message: 'text_624ea7c29103fd010732ab7d',
      })
    }

    addPaymentTermIssues(ctx, values.paymentTerm, ['paymentTerm'])
  })

interface InvoicingSettingsDrawerContentExtraProps {
  viewType: ViewTypeEnum
  customerId?: string
  showCustomSection: boolean
  /** Enabled for billing objects whose mutation payload supports invoice consolidation. */
  withInvoiceConsolidation: boolean
  /** Enables the payment term section, labelled with the term the object would inherit. */
  paymentTermInheritedFrom?: PaymentTermInheritedFrom
}

const invoicingSettingsDrawerContentDefaultProps: InvoicingSettingsDrawerContentExtraProps = {
  viewType: ViewTypeEnum.Subscription,
  customerId: undefined,
  showCustomSection: false,
  withInvoiceConsolidation: false,
  paymentTermInheritedFrom: undefined,
}

const InvoicingSettingsDrawerContent = withForm({
  defaultValues: DEFAULT_VALUES,
  props: invoicingSettingsDrawerContentDefaultProps,
  render: function InvoicingSettingsDrawerContentRender({
    form,
    viewType,
    customerId,
    showCustomSection,
    withInvoiceConsolidation,
    paymentTermInheritedFrom,
  }) {
    const { translate } = useInternationalization()
    const isContract = viewType === ViewTypeEnum.Contract
    const viewTypeLabel = translate(VIEW_TYPE_TRANSLATION_KEYS[viewType])
    const titleKey = getInvoicingSettingsTitleKey(viewType)
    const invoiceCustomSection = useStore(form.store, (s) => s.values.invoiceCustomSection)
    const invoiceCustomSectionError = useStore(
      form.store,
      (s) => s.fieldMeta.invoiceCustomSection?.errors?.[0]?.message,
    )

    return (
      <CenteredPage.SectionWrapper>
        <CenteredPage.PageTitle
          title={translate(titleKey)}
          description={translate(VIEW_TYPE_INVOICING_CAPTION_KEYS[viewType])}
        />

        <CenteredPage.SubsectionWrapper>
          {withInvoiceConsolidation && (
            <CenteredPage.PageSection>
              <CenteredPage.PageSectionTitle
                title={translate('text_177874535109128tmqdq682k')}
                description={translate(
                  isContract ? 'text_1790018785008epy1bgmaoxb' : 'text_17827386443477iuks0kxmx5',
                )}
              />
              <SubscriptionInvoiceConsolidationSection
                form={form}
                fields={{ consolidateInvoice: 'consolidateInvoice' }}
                translationKeys={isContract ? CONTRACT_CONSOLIDATION_TRANSLATION_KEYS : undefined}
              />
            </CenteredPage.PageSection>
          )}

          {showCustomSection && customerId && (
            <CenteredPage.PageSection>
              <CenteredPage.PageSectionTitle
                title={translate('text_1749024634192ov41w9fp6r2')}
                description={translate('text_1782738644347o1c2bvdta8j', { object: viewTypeLabel })}
              />
              <InvoiceCustomSectionFields
                viewType={viewType}
                customerId={customerId}
                value={invoiceCustomSection}
                onChange={(value) => form.setFieldValue('invoiceCustomSection', value)}
                onBehaviorChange={(behavior) =>
                  form.setFieldValue('invoiceCustomSectionBehavior', behavior)
                }
                error={invoiceCustomSectionError ? translate(invoiceCustomSectionError) : undefined}
              />
            </CenteredPage.PageSection>
          )}

          {!!paymentTermInheritedFrom && (
            <CenteredPage.PageSection>
              <CenteredPage.PageSectionTitle
                title={translate('text_17876033821633o4yokqvqdl')}
                description={translate('text_17931792049568q3rz3frwrx')}
              />
              <PaymentTermFormContent
                form={form}
                fields="paymentTerm"
                inheritedFrom={paymentTermInheritedFrom}
                displayInDialog
              />
            </CenteredPage.PageSection>
          )}
        </CenteredPage.SubsectionWrapper>
      </CenteredPage.SectionWrapper>
    )
  },
})

interface UseInvoicingSettingsDrawerProps {
  viewType: ViewTypeEnum
  customerId?: string
  showCustomSection: boolean
  withInvoiceConsolidation?: boolean
  paymentTermInheritedFrom?: PaymentTermInheritedFrom
  onSave: (values: InvoicingSettingsValues) => void | Promise<void>
}

interface UseInvoicingSettingsDrawerReturn {
  openDrawer: (values: {
    consolidateInvoice?: boolean
    invoiceCustomSection?: InvoiceCustomSectionInput | null
    paymentTerm?: PaymentTermFormValues
  }) => void
}

export const useInvoicingSettingsDrawer = ({
  viewType,
  customerId,
  showCustomSection,
  withInvoiceConsolidation = false,
  paymentTermInheritedFrom,
  onSave,
}: UseInvoicingSettingsDrawerProps): UseInvoicingSettingsDrawerReturn => {
  const { translate } = useInternationalization()
  const titleKey = getInvoicingSettingsTitleKey(viewType)
  const drawer = useFormDrawer()

  const form = useAppForm({
    defaultValues: DEFAULT_VALUES,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: invoicingSettingsValidationSchema,
    },
    onSubmit: async ({ value }) => {
      await onSave({
        consolidateInvoice: value.consolidateInvoice,
        invoiceCustomSection: value.invoiceCustomSection,
        paymentTerm: value.paymentTerm,
      })
      drawer.close()
    },
  })

  const openDrawer: UseInvoicingSettingsDrawerReturn['openDrawer'] = (values): void => {
    const invoiceCustomSection = values.invoiceCustomSection ?? DEFAULT_VALUES.invoiceCustomSection

    form.reset(
      {
        consolidateInvoice: values.consolidateInvoice ?? DEFAULT_VALUES.consolidateInvoice,
        invoiceCustomSection,
        invoiceCustomSectionBehavior: deriveInvoiceCustomSectionBehavior(invoiceCustomSection),
        paymentTerm: values.paymentTerm ?? DEFAULT_VALUES.paymentTerm,
      },
      { keepDefaultValues: true },
    )

    drawer.open({
      title: translate(titleKey),
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
          withInvoiceConsolidation={withInvoiceConsolidation}
          paymentTermInheritedFrom={paymentTermInheritedFrom}
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

  return { openDrawer }
}
