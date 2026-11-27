import { setResolved, withTriggered } from '~/components/alerts/utils'
import { ScopeEntryFormValues } from '~/components/scope/scopeEntry'
import { deserializeAmount, serializeAmount } from '~/core/serializers/serializeAmount'
import {
  ContractAlertForDrawerFragment,
  ContractAlertScopeInput,
  ContractAlertScopeTypeEnum,
  ContractAlertTypeEnum,
  CreateContractAlertInput,
  CurrencyEnum,
  ThresholdInput,
  UpdateContractAlertInput,
} from '~/generated/graphql'

import { PRODUCT_SCOPE_TYPE } from './alertScope'
import { ContractAlertFormValues } from './validationSchema'

export type ValidatedContractAlertFormValues = Omit<ContractAlertFormValues, 'alertType'> & {
  alertType: ContractAlertTypeEnum
}

type CreateTarget = { kind: 'create'; contractId: string; currency: CurrencyEnum }
type UpdateTarget = { kind: 'update'; id: string; currency: CurrencyEnum }

const stripTrailingZeros = (value: string): string => {
  if (!value.includes('.')) return value

  let end = value.length

  while (value[end - 1] === '0') end--
  if (value[end - 1] === '.') end--

  return value.slice(0, end)
}

const mapScopeFromApi = ({
  scope: [entry],
}: ContractAlertForDrawerFragment): ScopeEntryFormValues | null => {
  if (!entry) return null

  const [productFilter] = entry.productFilters ?? []

  if (productFilter) {
    return {
      type: PRODUCT_SCOPE_TYPE,
      productCode: entry.product.code,
      productFilterCode: productFilter.code,
      withProductFilters: false,
    }
  }

  return {
    type: PRODUCT_SCOPE_TYPE,
    productCode: entry.product.code,
    productFilterCode: '',
    withProductFilters: !!entry.withProductFilters,
  }
}

export const mapFromApiToForm = (
  alert: ContractAlertForDrawerFragment,
  currency: CurrencyEnum,
): ContractAlertFormValues => {
  const isUnits = alert.alertType === ContractAlertTypeEnum.UsageUnits
  const thresholds = alert.thresholds.map(({ code, recurring, value, notifyOn }) => ({
    code,
    recurring,
    value: isUnits ? stripTrailingZeros(value) : String(deserializeAmount(value, currency)),
    notifyOn: recurring ? setResolved(notifyOn, false) : withTriggered(notifyOn),
  }))

  return {
    name: alert.name ?? '',
    code: alert.code,
    alertType: alert.alertType,
    scope: mapScopeFromApi(alert),
    thresholds,
  }
}

const mapThresholdsToApi = (
  { alertType, thresholds }: ValidatedContractAlertFormValues,
  currency: CurrencyEnum,
): ThresholdInput[] =>
  thresholds.map(({ code, recurring, value, notifyOn }) => ({
    code,
    recurring,
    value:
      alertType === ContractAlertTypeEnum.UsageUnits
        ? value
        : String(serializeAmount(value, currency)),
    notifyOn: recurring ? setResolved(notifyOn, false) : withTriggered(notifyOn),
  }))

const mapScopeToApi = (scope: ScopeEntryFormValues | null): ContractAlertScopeInput[] => {
  if (!scope?.productCode) return []

  if (scope.productFilterCode) {
    return [
      {
        type: ContractAlertScopeTypeEnum.Contract,
        productCode: scope.productCode,
        productFilterCodes: [scope.productFilterCode],
      },
    ]
  }

  return [
    {
      type: ContractAlertScopeTypeEnum.Contract,
      productCode: scope.productCode,
      withProductFilters: scope.withProductFilters,
    },
  ]
}

export function mapFromFormToApi(
  values: ValidatedContractAlertFormValues,
  target: CreateTarget,
): CreateContractAlertInput
export function mapFromFormToApi(
  values: ValidatedContractAlertFormValues,
  target: UpdateTarget,
): UpdateContractAlertInput
export function mapFromFormToApi(
  values: ValidatedContractAlertFormValues,
  target: CreateTarget | UpdateTarget,
): CreateContractAlertInput | UpdateContractAlertInput {
  const thresholds = mapThresholdsToApi(values, target.currency)

  if (target.kind === 'update') {
    return { id: target.id, name: values.name, thresholds }
  }

  return {
    contractId: target.contractId,
    name: values.name,
    code: values.code,
    alertType: values.alertType,
    scope: mapScopeToApi(values.scope),
    thresholds,
  }
}
