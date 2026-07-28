import { Button } from '~/components/designSystem/Button'
import { useFilters } from '~/components/Filters/graphql/useFilters'
import { ActiveFiltersList } from '~/components/Filters/presentation/ActiveFiltersList'
import { FiltersPanelPopper } from '~/components/Filters/presentation/FiltersPanelPopper'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { tw } from '~/styles/utils'

interface FiltersProps {
  className?: string
}

export const Filters = ({ className }: FiltersProps) => {
  const { translate } = useInternationalization()

  const { hasAppliedFilters, resetFilters } = useFilters()

  return (
    <div className={tw('flex w-full flex-wrap items-center gap-3 overflow-y-auto', className)}>
      <FiltersPanelPopper />
      <ActiveFiltersList />

      {hasAppliedFilters && (
        <Button variant="quaternary" size="small" onClick={resetFilters}>
          {translate('text_66ab4886cc65a6006ee7258c')}
        </Button>
      )}
    </div>
  )
}
