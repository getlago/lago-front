import { Typography } from '~/components/designSystem/Typography'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withFieldGroup } from '~/hooks/forms/useAppform'

type ChargeDisplayInQuoteDocumentOptionValues = {
  displayInQuoteDocument: boolean
}

type ChargeDisplayInQuoteDocumentOptionProps = {
  disabled?: boolean
}

const defaultValues: ChargeDisplayInQuoteDocumentOptionValues = {
  displayInQuoteDocument: true,
}

const defaultProps: ChargeDisplayInQuoteDocumentOptionProps = {
  disabled: false,
}

export const ChargeDisplayInQuoteDocumentOption = withFieldGroup({
  defaultValues,
  props: defaultProps,
  render: function Render({ group, disabled }) {
    const { translate } = useInternationalization()

    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <Typography variant="captionHl" color="grey700">
            {translate('text_1788938888298p8mb2uxfk5l')}
          </Typography>
          <Typography variant="caption" color="grey600">
            {translate('text_1788938888298tobp5ik7edt')}
          </Typography>
        </div>

        <group.AppField name="displayInQuoteDocument">
          {(field) => (
            <field.SwitchField
              label={translate('text_1788938888298p8mb2uxfk5l')}
              disabled={disabled}
            />
          )}
        </group.AppField>
      </div>
    )
  },
})
