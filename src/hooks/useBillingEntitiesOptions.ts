import { useMemo } from 'react'

import { useGetBillingEntitiesQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export type BillingEntityOption = {
  id: string
  /** Entity code — used as the ComboBox value. */
  value: string
  /** ComboBox display label (entity name + "(default)" suffix when default). */
  label: string
  /** Raw entity name, without the "(default)" suffix — for display outside the picker. */
  name?: string | null
  isDefault: boolean
  /** Whether the entity uses Lago EU Tax Management — drives the billing-entity tax alerts. */
  euTaxManagement: boolean
}

/**
 * ComboBox `value` of the "inherit from the customer" option.
 *
 * Deliberately NOT an empty string: `ComboBox` renders `value={value || null}`, so an empty value
 * is indistinguishable from "no selection", and with `clearOnBlur` the option could be picked but
 * never held — the field emptied itself on blur. The option's `id` stays empty, so callers still
 * submit `null`. Reserved-looking on purpose, since it is matched against real entity codes.
 */
export const BILLING_ENTITY_INHERIT_CODE = '__lago_inherit_billing_entity__'

type UseBillingEntitiesOptionsParams = {
  /**
   * When true, prepends a sentinel option representing "no explicit binding —
   * inherit from the customer's default billing entity at billing time".
   * The sentinel option has an empty `id` so callers can submit `null` / omit
   * the field when this is selected, and `BILLING_ENTITY_INHERIT_CODE` as its
   * ComboBox value. Mirrors the `paymentMethod` reference pattern
   * (subscription/wallet inherit from customer if not set).
   */
  includeInheritOption?: boolean
  /**
   * Custom label for the inherit option. Defaults to a given translation.
   */
  inheritLabel?: string
  /**
   * Skip the network query (e.g. when caller hasn't loaded yet).
   */
  skip?: boolean
}

type UseBillingEntitiesOptionsResult = {
  /** Combobox-ready list. Default entity is sorted first. */
  options: BillingEntityOption[]
  isLoading: boolean
  /** Code of the default billing entity, if known. */
  defaultEntityCode: string | undefined
  /** True when the org has more than one billing entity configured. */
  hasMultipleEntities: boolean
}

/**
 * Returns the org's billing entities formatted as ComboBox options.
 *
 * Use the `includeInheritOption` flag for forms creating/editing billing
 * objects (subscriptions, wallets, one-off invoices, preview) where leaving
 * the picker empty means "inherit from customer default" — the same semantic
 * applied to `paymentMethod` references.
 *
 * Customer create/edit forms should leave `includeInheritOption` off because
 * a customer always carries a (mutable) default billing entity (NOT NULL).
 */
export const useBillingEntitiesOptions = ({
  includeInheritOption = false,
  inheritLabel,
  skip = false,
}: UseBillingEntitiesOptionsParams = {}): UseBillingEntitiesOptionsResult => {
  const { translate } = useInternationalization()
  const { data, loading } = useGetBillingEntitiesQuery({
    fetchPolicy: 'cache-and-network',
    skip,
  })

  const collection = data?.billingEntities?.collection

  return useMemo(() => {
    const formatted: BillingEntityOption[] =
      collection
        ?.map((entity) => {
          const defaultSuffix = entity.isDefault
            ? ` (${translate('text_1744018116743pwoqp40bkhp')})`
            : ''

          return {
            id: entity.id,
            value: entity.code,
            label: `${entity.name || entity.code}${defaultSuffix}`,
            name: entity.name,
            isDefault: !!entity.isDefault,
            euTaxManagement: !!entity.euTaxManagement,
          }
        })
        .sort((a, b) => Number(b.isDefault) - Number(a.isDefault)) ?? []

    const defaultEntity = formatted.find((option) => option.isDefault)

    if (includeInheritOption) {
      formatted.unshift({
        id: '',
        value: BILLING_ENTITY_INHERIT_CODE,
        label: inheritLabel ?? translate('text_1778155404199jv285agrvax'),
        isDefault: false,
        euTaxManagement: false,
      })
    }

    return {
      options: formatted,
      isLoading: loading,
      defaultEntityCode: defaultEntity?.value,
      hasMultipleEntities: (collection?.length ?? 0) > 1,
    }
  }, [collection, loading, translate, includeInheritOption, inheritLabel])
}
