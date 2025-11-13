import { gql } from '@apollo/client'
import { useEffect, useState } from 'react'

import { Button, Chip, Tooltip, Typography } from '~/components/designSystem'
import { InvoiceCustomerFooterSelection } from '~/components/invoceCustomFooter/InvoiceCustomerFooterSelection'
import { MappedInvoiceSection } from '~/components/invoceCustomFooter/types'
import {
  CustomerAppliedInvoiceCustomSectionsFragmentDoc,
  useGetCustomerAppliedInvoiceCustomSectionsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

gql`
  query getCustomerAppliedInvoiceCustomSections($id: ID!) {
    customer(id: $id) {
      id
      ...CustomerAppliedInvoiceCustomSections
    }
  }

  ${CustomerAppliedInvoiceCustomSectionsFragmentDoc}
`

interface InvoceCustomFooterProps {
  customerId: string
}

export const InvoceCustomFooter = ({ customerId }: InvoceCustomFooterProps) => {
  const { translate } = useInternationalization()
  const [selectedItems, setSelectedItems] = useState<MappedInvoiceSection[]>([])
  const [shouldDisplayCombobox, setShouldDisplayCombobox] = useState(false)

  const { data: customerData } = useGetCustomerAppliedInvoiceCustomSectionsQuery({
    variables: { id: customerId },
    skip: !customerId,
  })

  const onChange = (item: MappedInvoiceSection) => {
    const isItemAlreadySelected = selectedItems.find(({ id }) => id === item.id)

    if (!isItemAlreadySelected) {
      setSelectedItems([...selectedItems, item])
    }

    setShouldDisplayCombobox(false)
  }

  const handleRemoveSection = (itemId: string) => {
    const itemsWithoutRemovedItem = selectedItems.filter(({ id }) => id !== itemId)

    setSelectedItems(itemsWithoutRemovedItem)
  }

  // This represents the initial state of the selectedItems state
  // when the customer InvoiceCustomSections are loaded
  useEffect(() => {
    const customerSections = customerData?.customer?.configurableInvoiceCustomSections

    if (!customerSections?.length) return

    setSelectedItems(customerSections)
  }, [customerData?.customer?.configurableInvoiceCustomSections])

  return (
    <div>
      <Typography variant="captionHl" color="textSecondary">
        {translate('text_17628623882713knw0jtohiw')}
      </Typography>
      <Typography variant="caption" className="mb-4">
        {translate('text_1762862855282gldrtploh46')}
      </Typography>
      <div className="flex flex-col gap-4">
        {selectedItems.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedItems.map((section) => (
              <Chip
                key={section.id}
                label={section.name}
                onDelete={() => handleRemoveSection(section.id)}
              />
            ))}
          </div>
        )}

        {!shouldDisplayCombobox ? (
          <Button
            fitContent
            startIcon="plus"
            variant="inline"
            onClick={() => {
              setShouldDisplayCombobox(true)
            }}
          >
            {translate('text_1762862908777d78m2z5d29a')}
          </Button>
        ) : (
          <div className="flex items-center">
            <div className="flex-1">
              <InvoiceCustomerFooterSelection
                placeholder={translate('text_1762947620814hsqq7d88d7c')}
                emptyText={translate('text_1762952250941g1m9u5hpclb')}
                onChange={onChange}
                selectedItems={selectedItems}
              />
            </div>

            <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
              <Button
                icon="trash"
                variant="quaternary"
                onClick={() => {
                  setShouldDisplayCombobox(false)
                }}
              />
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  )
}
