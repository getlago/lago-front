import { Button } from '~/components/designSystem/Button'
import { Popper } from '~/components/designSystem/Popper'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { MenuPopper } from '~/styles'

import { usePremiumWarningDialog } from '../dialogs/PremiumWarningDialog'

export const AnalyticsPeriodScopeEnum = {
  Year: 'year',
  Quarter: 'quarter',
  Month: 'month',
} as const

export const PeriodScopeTranslationLookup = {
  [AnalyticsPeriodScopeEnum.Year]: 'text_6553885df387fd0097fd7383',
  [AnalyticsPeriodScopeEnum.Quarter]: 'text_65562f85ed468200b9debb48',
  [AnalyticsPeriodScopeEnum.Month]: 'text_65562f85ed468200b9debb49',
}

export type TPeriodScopeTranslationLookupValue =
  (typeof AnalyticsPeriodScopeEnum)[keyof typeof AnalyticsPeriodScopeEnum]

const MonthSelectorDropdown = ({
  periodScope,
  setPeriodScope,
}: {
  periodScope: TPeriodScopeTranslationLookupValue
  setPeriodScope: (periodScope: TPeriodScopeTranslationLookupValue) => void
}) => {
  const { isPremium, currentUser } = useCurrentUser()
  const { translate } = useInternationalization()

  const premiumWarningDialog = usePremiumWarningDialog()

  return (
    <>
      {isPremium && !!currentUser ? (
        <Popper
          PopperProps={{ placement: 'bottom-end' }}
          opener={
            <Button variant="inline" endIcon={'chevron-down'}>
              {translate(PeriodScopeTranslationLookup[periodScope])}
            </Button>
          }
        >
          {({ closePopper }) => (
            <MenuPopper>
              <Button
                disabled={periodScope === AnalyticsPeriodScopeEnum.Year}
                variant="quaternary"
                align="left"
                onClick={() => {
                  setPeriodScope(AnalyticsPeriodScopeEnum.Year)
                  closePopper()
                }}
              >
                {translate(PeriodScopeTranslationLookup[AnalyticsPeriodScopeEnum.Year])}
              </Button>
              <Button
                disabled={periodScope === AnalyticsPeriodScopeEnum.Quarter}
                variant="quaternary"
                align="left"
                onClick={() => {
                  setPeriodScope(AnalyticsPeriodScopeEnum.Quarter)
                  closePopper()
                }}
              >
                {translate(PeriodScopeTranslationLookup[AnalyticsPeriodScopeEnum.Quarter])}
              </Button>
              <Button
                disabled={periodScope === AnalyticsPeriodScopeEnum.Month}
                variant="quaternary"
                align="left"
                onClick={() => {
                  setPeriodScope(AnalyticsPeriodScopeEnum.Month)
                  closePopper()
                }}
              >
                {translate(PeriodScopeTranslationLookup[AnalyticsPeriodScopeEnum.Month])}
              </Button>
            </MenuPopper>
          )}
        </Popper>
      ) : (
        <Button
          variant="quaternary"
          endIcon="sparkles"
          onClick={() => {
            premiumWarningDialog.open()
          }}
        >
          {translate(PeriodScopeTranslationLookup[periodScope])}
        </Button>
      )}
    </>
  )
}

export default MonthSelectorDropdown
