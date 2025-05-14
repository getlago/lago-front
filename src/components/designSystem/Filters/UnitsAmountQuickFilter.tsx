import { useNavigate } from 'react-router-dom'

import { UsageBreakdownType } from '~/components/analytics/usage/UsageBreakdownSection'
import { Button, Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { tw } from '~/styles/utils'

import { useFilters } from './useFilters'

const QuickFilterButton = ({
  children,
  isSelected,
  onClick,
}: {
  children: React.ReactNode
  isSelected: boolean
  onClick: () => void
}) => (
  <Button
    size="small"
    className={tw({
      'text-blue-600 [&>div]:text-blue-600': isSelected,
    })}
    variant={isSelected ? 'secondary' : 'quaternary'}
    onClick={onClick}
  >
    {children}
  </Button>
)

const TRANSLATIONS_MAP = {
  [UsageBreakdownType.Units]: 'text_17465414264637hzft31ck6c',
  [UsageBreakdownType.Amount]: 'text_1746541426463wcwfuryd12g',
}

export const UnitsAmountQuickFilter = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const { isQuickFilterActive, selectUnitsAmount } = useFilters()

  return (
    <div className="flex items-center gap-1">
      {[UsageBreakdownType.Units, UsageBreakdownType.Amount].map((value) => (
        <QuickFilterButton
          key={`quick-filter-time-interval-${value}`}
          isSelected={isQuickFilterActive({ amountUnits: value })}
          onClick={() => {
            navigate({ search: selectUnitsAmount(value) })
          }}
        >
          <Typography variant="captionHl" color="grey600">
            {translate(TRANSLATIONS_MAP[value])}
          </Typography>
        </QuickFilterButton>
      ))}
    </div>
  )
}
