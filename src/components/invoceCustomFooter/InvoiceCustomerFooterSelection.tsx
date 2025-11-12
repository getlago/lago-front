import { useMemo } from 'react'

import { BasicMultipleComboBoxData, MultipleComboBox } from '~/components/form'
import { MappedInvoiceSection } from '~/components/invoceCustomFooter/types'
import { InvoiceCustomSection } from '~/hooks/useInvoiceCustomSections'

interface InvoiceCustomerFooterSelectionProps {
  onChange?: (items: MappedInvoiceSection[]) => void
  label?: string
  placeholder?: string
  emptyText?: string
  className?: string
  disabled?: boolean
  name?: string
  loading?: boolean
  data: InvoiceCustomSection[]
}

type MultipleComboBoxOption = Pick<BasicMultipleComboBoxData, 'value' | 'label'>

export const InvoiceCustomerFooterSelection = ({
  loading,
  data,
  label = '',
  placeholder,
  emptyText,
  className,
  disabled: externalDisabled = false,
  name = 'selectPaymentMethod',
  onChange,
}: InvoiceCustomerFooterSelectionProps) => {
  const options = useMemo(() => {
    return data.map<MultipleComboBoxOption>((section) => ({
      label: section.name,
      value: section.id,
    }))
  }, [data])

  const handleChange = (selectedSections: MultipleComboBoxOption[]) => {
    const mapOptionsToCustomerInvoiceSections = selectedSections.map<MappedInvoiceSection>(
      (section) => ({
        id: section.value,
        name: section.label || '',
      }),
    )

    onChange?.(mapOptionsToCustomerInvoiceSections)
  }

  return (
    <MultipleComboBox
      className={className}
      name={name}
      data={options}
      label={label}
      placeholder={placeholder}
      emptyText={emptyText}
      value={[]}
      onChange={(item) => handleChange(item)}
      disabled={externalDisabled || loading}
      sortValues={false}
      hideTags={false}
      forcePopupIcon
    />
  )
}
