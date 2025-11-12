import { useMemo, useState } from 'react'

import { MultipleComboBox } from '~/components/form'
import { useInvoiceCustomSections } from '~/hooks/useInvoiceCustomSections'

interface InvoiceCustomerFooterSelectionProps {
  externalCustomerId: string
  value?: string[]
  onChange?: (value: string[]) => void
  label?: string
  placeholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  name?: string
}

export const InvoiceCustomerFooterSelection = ({
  label = '',
  placeholder,
  emptyText,
  className,
  disabled: externalDisabled = false,
  name = 'selectPaymentMethod',
  value,
  onChange,
}: InvoiceCustomerFooterSelectionProps) => {
  const [selectedValue, setSelectedValue] = useState<string[]>([])
  const { data: invoiceCustomSections, loading } = useInvoiceCustomSections()

  const options = useMemo(() => {
    return invoiceCustomSections.map((section) => ({
      label: section.name,
      labelNode: section.name,
      description: section.code,
      value: section.id,
    }))
  }, [invoiceCustomSections])

  const handleChange = (selectedSections: Array<{ value: string; label?: string }>) => {
    const newValue = selectedSections.map((section) => section.value)

    setSelectedValue(newValue)
    onChange?.(newValue)
  }

  const formattedValue = useMemo(() => {
    const ids = value ?? selectedValue

    return ids.map((id) => {
      const foundSection = options.find((section) => section.value === id)

      return {
        value: id,
        label: foundSection?.label,
      }
    })
  }, [value, selectedValue, options])

  return (
    <MultipleComboBox
      className={className}
      name={name}
      data={options}
      label={label}
      placeholder={placeholder}
      emptyText={emptyText}
      value={formattedValue}
      onChange={handleChange}
      disabled={externalDisabled || loading}
      sortValues={false}
      hideTags={false}
      forcePopupIcon
    />
  )
}
