import { useMemo } from 'react'

import { Typography } from '~/components/designSystem'
import { ComboBox, ComboboxItem } from '~/components/form'
import { MappedInvoiceSection } from '~/components/invoceCustomFooter/types'
import { mapItemsToCustomerInvoiceSection } from '~/components/invoceCustomFooter/utils'
import { useInvoiceCustomSectionsLazy } from '~/hooks/useInvoiceCustomSections'

interface InvoiceCustomerFooterSelectionProps {
  onChange?: (item: MappedInvoiceSection) => void
  label?: string
  placeholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  name?: string
  selectedItems?: MappedInvoiceSection[]
}

export const InvoiceCustomerFooterSelection = ({
  label = '',
  placeholder,
  emptyText,
  className,
  disabled: externalDisabled = false,
  name = 'selectPaymentMethod',
  selectedItems = [],
  onChange,
}: InvoiceCustomerFooterSelectionProps) => {
  const { getInvoiceCustomSections, data, loading } = useInvoiceCustomSectionsLazy()

  const handleChange = (id: string) => {
    const item = data?.find((section) => section.id === id)

    if (item) {
      const mappedItem = mapItemsToCustomerInvoiceSection(item)

      onChange?.(mappedItem)
    }
  }

  const options = useMemo(() => {
    if (!data) return []

    const selectedSectionIds = selectedItems.map((section) => section.id)

    return data.map(({ id, name: itemName }) => {
      const disabled = selectedSectionIds.includes(id)

      return {
        label: itemName,
        labelNode: (
          <ComboboxItem>
            <Typography variant="body" color="grey700" noWrap>
              {itemName}
            </Typography>
          </ComboboxItem>
        ),
        value: id,
        disabled,
      }
    })
  }, [data, selectedItems])

  return (
    <ComboBox
      onOpen={async () => await getInvoiceCustomSections()}
      loading={loading}
      className={className}
      name={name}
      data={options}
      label={label}
      placeholder={placeholder}
      emptyText={emptyText}
      onChange={(item) => handleChange(item)}
      disabled={externalDisabled || loading}
      sortValues={false}
    />
  )
}
