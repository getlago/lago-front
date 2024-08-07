import { DateTime } from 'luxon'
import styled from 'styled-components'

import { DatePicker } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import { Typography } from '../../Typography'
import { FiltersFormValues } from '../FiltersPanelPoper'

type FiltersItemIssuingDateProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemIssuingDate = ({
  value = ',',
  setFilterValue,
}: FiltersItemIssuingDateProps) => {
  const { translate } = useInternationalization()

  return (
    <IssuingDateContainer>
      <CustomDatePicker
        showErrorInTooltip
        onChange={(issuingDateFrom) => {
          // replace the value.split(',')[0] with the new value
          setFilterValue(
            `${DateTime.fromISO(issuingDateFrom as string).startOf('day')},${value.split(',')[1]}`,
          )
        }}
        value={value.split(',')[0]}
      />
      <Typography variant="body" color="grey700">
        <div className="show-bellow-lg">-</div>
        <div className="show-above-lg">
          {translate('text_65f8472df7593301061e27d6').toLowerCase()}
        </div>
      </Typography>
      <CustomDatePicker
        showErrorInTooltip
        onChange={(issuingDateTo) => {
          // replace the value.split(',')[1] with the new value
          setFilterValue(
            `${value.split(',')[0]},${DateTime.fromISO(issuingDateTo as string).endOf('day')}`,
          )
        }}
        value={value.split(',')[1]}
      />
    </IssuingDateContainer>
  )
}

const IssuingDateContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(2)};

  ${theme.breakpoints.up('lg')} {
    gap: ${theme.spacing(3)};
  }

  .MuiTextField-root {
    width: 100%;
  }

  .show-above-lg {
    display: none;

    ${theme.breakpoints.up('lg')} {
      display: block;
    }
  }

  .show-bellow-lg {
    display: block;

    ${theme.breakpoints.up('lg')} {
      display: none;
    }
  }
`

const CustomDatePicker = styled(DatePicker)`
  flex: 1;
`
