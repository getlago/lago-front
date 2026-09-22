import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withFieldGroup } from '~/hooks/forms/useAppform'

export const CONSOLIDATION_SECTION_TEST_ID = 'consolidation-section'

type SubscriptionInvoiceConsolidationGroupValues = {
  consolidateInvoice: boolean
}

type InvoiceConsolidationTranslationKeys = {
  consolidateDescription: string
  isolateDescription: string
}

const DEFAULT_TRANSLATION_KEYS: InvoiceConsolidationTranslationKeys = {
  consolidateDescription: 'text_1778745351091u1rjnmr88ua',
  isolateDescription: 'text_177874535109218palud3t3o',
}

const defaultValues: SubscriptionInvoiceConsolidationGroupValues = {
  consolidateInvoice: true,
}

export const SubscriptionInvoiceConsolidationSection = withFieldGroup({
  defaultValues,
  props: {} as { translationKeys?: InvoiceConsolidationTranslationKeys },
  render: function Render({ group, translationKeys }) {
    const { translate } = useInternationalization()
    const keys = translationKeys ?? DEFAULT_TRANSLATION_KEYS

    return (
      <div data-test={CONSOLIDATION_SECTION_TEST_ID}>
        <group.AppField name="consolidateInvoice">
          {(field) => (
            <field.RadioGroupField
              optionsGapSpacing={3}
              optionLabelVariant="body"
              options={[
                {
                  value: true,
                  label: translate('text_1778745351091h7z5baw0ta6'),
                  sublabel: translate(keys.consolidateDescription),
                },
                {
                  value: false,
                  label: translate('text_1778745351091fxaqr5dwok8'),
                  sublabel: translate(keys.isolateDescription),
                },
              ]}
            />
          )}
        </group.AppField>
      </div>
    )
  },
})
