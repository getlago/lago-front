import { useStore } from '@tanstack/react-form'
import { useEffect, useMemo } from 'react'

import type { CustomerConnectionDrawerFormApi } from '~/components/customerConnections/CustomerConnectionDrawer'
import { useQuickbooksCustomerItems } from '~/components/customerConnections/useQuickbooksCustomerItems'
import { Button } from '~/components/designSystem/Button'
import { BasicComboBoxData } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type QuickbooksCustomerIdFieldProps = {
  form: CustomerConnectionDrawerFormApi
  integrationId: string | undefined
  connectionName: string
}

// `ComboBox` clears its field when the selected option leaves `data`, so the picked customer stays
// in the list, hidden, when a later search does not return it.
const withSelectedOption = (
  options: BasicComboBoxData[],
  selectedValue: string | undefined,
): BasicComboBoxData[] => {
  if (!selectedValue || options.some(({ value }) => value === selectedValue)) return options

  return [...options, { value: selectedValue, label: selectedValue, hidden: true }]
}

// External id of a QuickBooks connection: a picker of the stored QuickBooks customers, or the
// plain id input while none is stored, so an id can always be typed.
export const QuickbooksCustomerIdField = ({
  form,
  integrationId,
  connectionName,
}: QuickbooksCustomerIdFieldProps) => {
  const { translate } = useInternationalization()
  const { options, hasStoredCustomers, isLoading, isRefreshing, search, refresh, refreshOnce } =
    useQuickbooksCustomerItems(integrationId)

  const selectedValue = useStore(form.store, (state) => state.values.externalCustomerId)

  // The first drawer opened on an integration syncs its customers, so a new one is listed.
  useEffect(() => {
    refreshOnce()
  }, [refreshOnce])

  const data = useMemo(() => withSelectedOption(options, selectedValue), [options, selectedValue])

  return (
    <div className="flex flex-row items-end gap-3">
      <div className="flex-1">
        <form.AppField name="externalCustomerId">
          {(field) =>
            hasStoredCustomers ? (
              <field.ComboBoxField
                data={data}
                loading={isLoading || isRefreshing}
                label={translate('text_1795450153419qsg9jme6t9o', { connectionName })}
                description={translate('text_1795450153419c7na4oxm1wr', { connectionName })}
                placeholder={translate('text_1795450153419mxue68940rx')}
                searchQuery={search}
                PopperProps={{ displayInDialog: true }}
              />
            ) : (
              <field.TextInputField
                label={translate('text_1784649473978u6kmffzlw0b', { connectionName })}
                description={translate('text_1784649473978uuc3oggbf1r', { connectionName })}
                placeholder={translate('text_1784649473978i3wq11ccip3')}
              />
            )
          }
        </form.AppField>
      </div>
      <Button
        icon="reload"
        variant="quaternary"
        disabled={isRefreshing}
        loading={isRefreshing}
        onClick={refresh}
      />
    </div>
  )
}
