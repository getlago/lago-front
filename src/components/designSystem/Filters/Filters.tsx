import { useNavigate, useSearchParams } from 'react-router-dom'

import { Button } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { tw } from '~/styles/utils'

import { ActiveFiltersList } from './ActiveFiltersList'
import { FiltersPanelPoper } from './FiltersPanelPoper'
import { AvailableFiltersEnum } from './types'

interface FiltersProps {
  filters: AvailableFiltersEnum[]
  className?: string
}

export const Filters = ({ className, filters }: FiltersProps) => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  let [searchParams] = useSearchParams()

  return (
    <div className={tw('flex w-full flex-wrap items-center gap-3 overflow-y-scroll', className)}>
      <FiltersPanelPoper filters={filters} />
      <ActiveFiltersList filters={filters} />

      {searchParams.size > 0 && (
        <Button variant="quaternary" size="small" onClick={() => navigate({ search: '' })}>
          {translate('text_66ab4886cc65a6006ee7258c')}
        </Button>
      )}
    </div>
  )
}
