import { useMemo } from 'react'

import { Typography } from '~/components/designSystem'
import { ComboBox, ComboboxItem } from '~/components/form'
import { MappedInvoiceSection } from '~/components/invoceCustomFooter/types'
import { InvoiceCustomSection } from '~/hooks/useInvoiceCustomSections'

interface InvoiceCustomerFooterSelectionProps {
  onChange?: (id: string) => void
  label?: string
  placeholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  name?: string
  loading?: boolean
  data: InvoiceCustomSection[]
  selectedSections: MappedInvoiceSection[]
}

export const InvoiceCustomerFooterSelection = ({
  loading,
  data,
  label = '',
  placeholder,
  emptyText,
  className,
  disabled: externalDisabled = false,
  name = 'selectPaymentMethod',
  selectedSections,
  onChange,
}: InvoiceCustomerFooterSelectionProps) => {
  const handleChange = (id: string) => {
    onChange?.(id)
  }

  const options = useMemo(() => {
    if (!data) return []

    const selectedSectionIds = selectedSections.map((section) => section.id)

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
  }, [data, selectedSections])

  return (
    <ComboBox
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
