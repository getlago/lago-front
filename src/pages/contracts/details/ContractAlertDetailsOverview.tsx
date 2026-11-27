import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { SectionHeader } from '~/components/plans/details-v2/shared/SectionHeader'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  ContractAlertForDrawerFragment,
  ContractAlertTypeEnum,
  CurrencyEnum,
  NotifyOnEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export const CONTRACT_ALERT_OVERVIEW_TEST_ID = 'contract-alert-overview'
export const CONTRACT_ALERT_OVERVIEW_NAME_TEST_ID = 'contract-alert-overview-name'
export const CONTRACT_ALERT_OVERVIEW_CODE_TEST_ID = 'contract-alert-overview-code'
export const CONTRACT_ALERT_OVERVIEW_TYPE_TEST_ID = 'contract-alert-overview-type'
export const CONTRACT_ALERT_OVERVIEW_SCOPE_CHIP_TEST_ID = 'contract-alert-overview-scope-chip'
export const CONTRACT_ALERT_OVERVIEW_THRESHOLDS_TEST_ID = 'contract-alert-overview-thresholds'

const ALERT_TYPE_TRANSLATION_KEYS: Record<ContractAlertTypeEnum, string> = {
  [ContractAlertTypeEnum.UsageAmount]: 'text_1795778599615a5pz68n29ac',
  [ContractAlertTypeEnum.UsageUnits]: 'text_17957785996152hmo3se75dd',
}

const THRESHOLD_VALUE_HEADER_TRANSLATION_KEYS: Record<ContractAlertTypeEnum, string> = {
  [ContractAlertTypeEnum.UsageAmount]: 'text_1748858044483q61vd2npre7',
  [ContractAlertTypeEnum.UsageUnits]: 'text_1748858070139kmh56doz3la',
}

const UNITS_MAXIMUM_FRACTION_DIGITS = 5

type FormatContractAlertThresholdValueArgs = {
  value: string
  alertType: ContractAlertTypeEnum
  currency: CurrencyEnum
  unitsLabel: string
}

export const formatContractAlertThresholdValue = ({
  value,
  alertType,
  currency,
  unitsLabel,
}: FormatContractAlertThresholdValueArgs): string => {
  if (alertType === ContractAlertTypeEnum.UsageAmount) {
    return intlFormatNumber(deserializeAmount(value, currency), { currency })
  }

  const units = intlFormatNumber(Number(value), {
    style: 'decimal',
    maximumFractionDigits: UNITS_MAXIMUM_FRACTION_DIGITS,
  })

  return `${units} ${unitsLabel}`
}

type ContractAlertDetailsOverviewProps = {
  alert: ContractAlertForDrawerFragment
  currency: CurrencyEnum
}

export const ContractAlertDetailsOverview = ({
  alert,
  currency,
}: ContractAlertDetailsOverviewProps): JSX.Element => {
  const { translate } = useInternationalization()

  const getScopeChipLabels = (): string[] => {
    if (!alert.scope.length) return [translate('text_1795788761952p7rvsj0a7jb')]

    return alert.scope.map(({ product, productFilters, withProductFilters }) => {
      const productName = product.invoiceDisplayName || product.name
      const [productFilter] = productFilters ?? []

      if (productFilter) {
        return translate('text_17957887619522gmmevjwqbp', {
          filterName: productFilter.invoiceDisplayName || productFilter.name,
          productName,
        })
      }

      if (withProductFilters) {
        return translate('text_1795788761952xv920y6zhgk', { productName })
      }

      return translate('text_1795788761952z950mwwnvax', { productName })
    })
  }

  const getThresholdLabel = (recurring: boolean, index: number): string => {
    if (recurring) return translate('text_17241798877230y851fdxzqu')
    if (index === 0) return translate('text_1747921119080dk04aab1ecy')

    return translate('text_1724179887723917j8ezkd9v')
  }

  const unitsLabel = translate('text_6282085b4f283b0102655884')

  const orderedThresholds = [
    ...alert.thresholds.filter(({ recurring }) => !recurring),
    ...alert.thresholds.filter(({ recurring }) => recurring),
  ]

  const thresholdRows = orderedThresholds.map(({ code, recurring, value, notifyOn }, index) => [
    getThresholdLabel(recurring, index),
    formatContractAlertThresholdValue({ value, alertType: alert.alertType, currency, unitsLabel }),
    code || '-',
    translate(
      notifyOn.includes(NotifyOnEnum.Resolved)
        ? 'text_65251f46339c650084ce0d57'
        : 'text_65251f4cd55aeb004e5aa5ef',
    ),
  ])

  return (
    <section className="flex flex-col gap-6" data-test={CONTRACT_ALERT_OVERVIEW_TEST_ID}>
      <SectionHeader
        title={translate('text_1746629929876zz4937djyc8')}
        description={translate('text_17957785996159r1uxvrhlad')}
        contentClassName="gap-2"
      />

      <div className="flex flex-col gap-4">
        <DetailsPage.InfoGrid
          grid={[
            {
              label: translate('text_1773051593208t1k4f2qw7z9'),
              value: (
                <span data-test={CONTRACT_ALERT_OVERVIEW_NAME_TEST_ID}>{alert.name || '-'}</span>
              ),
            },
            {
              label: translate('text_1773051593209lul0ssht3rk'),
              value: (
                <TypographyWithCopy
                  compact
                  variant="body"
                  color="grey700"
                  data-test={CONTRACT_ALERT_OVERVIEW_CODE_TEST_ID}
                >
                  {alert.code}
                </TypographyWithCopy>
              ),
            },
            {
              label: translate('text_1773051593209zqnmllcrxk9'),
              value: (
                <span data-test={CONTRACT_ALERT_OVERVIEW_TYPE_TEST_ID}>
                  {translate(ALERT_TYPE_TRANSLATION_KEYS[alert.alertType])}
                </span>
              ),
            },
          ]}
        />

        <div className="flex flex-col">
          <Typography variant="caption">{translate('text_1795778599615rapn25l32r3')}</Typography>
          <div className="flex flex-wrap gap-3">
            {getScopeChipLabels().map((label) => (
              <Chip
                key={label}
                label={label}
                color="grey700"
                data-test={CONTRACT_ALERT_OVERVIEW_SCOPE_CHIP_TEST_ID}
              />
            ))}
          </div>
        </div>
      </div>

      <div data-test={CONTRACT_ALERT_OVERVIEW_THRESHOLDS_TEST_ID}>
        <DetailsPage.TableDisplay
          name="contract-alert-thresholds"
          className="table-fixed"
          header={[
            '',
            translate(THRESHOLD_VALUE_HEADER_TRANSLATION_KEYS[alert.alertType]),
            translate('text_1748334091887k4p2p41jdou'),
            translate('text_1792439710542ctc2yq2zptb'),
          ]}
          body={thresholdRows}
        />
      </div>
    </section>
  )
}
