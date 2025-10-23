import { InputAdornment } from '@mui/material'

import { TextInput } from '~/components/form'
import { FixedChargeInput } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

interface FixedChargesUnitsProps {
  onChange: (value: string) => void
  value: FixedChargeInput['units']
}
const FixedChargesUnits = ({ onChange, value }: FixedChargesUnitsProps) => {
  const { translate } = useInternationalization()

  return (
    <TextInput
      label={translate('text_65771fa3f4ab9a00720726ce')}
      placeholder={translate('text_643e592657fc1ba5ce110c80')}
      beforeChangeFormatter={['positiveNumber', 'sextDecimal']}
      value={value || ''}
      onChange={onChange}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            {translate('text_6282085b4f283b0102655884')}
          </InputAdornment>
        ),
      }}
    />
  )
}

export default FixedChargesUnits
