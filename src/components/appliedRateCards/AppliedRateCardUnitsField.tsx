import InputAdornment from '@mui/material/InputAdornment'

import { useInternationalization } from '~/hooks/core/useInternationalization'
import { withFieldGroup } from '~/hooks/forms/useAppform'

type AppliedRateCardUnitsFieldValues = {
  units: string
}

type AppliedRateCardUnitsFieldProps = {
  dataTest?: string
}

const defaultValues: AppliedRateCardUnitsFieldValues = {
  units: '',
}

const defaultProps: AppliedRateCardUnitsFieldProps = {
  dataTest: undefined,
}

export const AppliedRateCardUnitsField = withFieldGroup({
  defaultValues,
  props: defaultProps,
  render: function AppliedRateCardUnitsFieldRender({ group, dataTest }) {
    const { translate } = useInternationalization()

    return (
      <group.AppField name="units">
        {(field) => (
          <field.TextInputField
            data-test={dataTest}
            label={translate('text_65771fa3f4ab9a00720726ce')}
            placeholder={translate('text_643e592657fc1ba5ce110c80')}
            beforeChangeFormatter={['positiveNumber', 'sextDecimal']}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  {translate('text_6282085b4f283b0102655884')}
                </InputAdornment>
              ),
            }}
          />
        )}
      </group.AppField>
    )
  },
})
