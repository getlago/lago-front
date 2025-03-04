import { DateTime } from 'luxon'

import { DatePicker } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { Typography } from '../../Typography'
import { FiltersFormValues } from '../types'

type FiltersItemDateProps = {
  value: FiltersFormValues['filters'][0]['value']
  setFilterValue: (value: string) => void
}

export const FiltersItemDate = ({ value = ',', setFilterValue }: FiltersItemDateProps) => {
  const { translate } = useInternationalization()
  const [givenValueFrom, givenValueTo] = value.split(',')

  return (
    <div className="flex items-center gap-2 lg:gap-3">
      <DatePicker
        showErrorInTooltip
        className="flex-1"
        onChange={(dateFrom) => {
          setFilterValue(`${DateTime.fromISO(dateFrom as string).startOf('day')},${givenValueTo}`)
        }}
        value={givenValueFrom}
      />
      <Typography variant="body" color="grey700">
        <div className="block lg:hidden">-</div>
        <div className="hidden lg:block">
          {translate('text_65f8472df7593301061e27d6').toLowerCase()}
        </div>
      </Typography>
      <DatePicker
        showErrorInTooltip
        className="flex-1"
        onChange={(dateTo) => {
          setFilterValue(`${givenValueFrom},${DateTime.fromISO(dateTo as string).endOf('day')}`)
        }}
        value={givenValueTo}
      />
    </div>
  )
}
