import { gql } from '@apollo/client'
import { useEffect, useState } from 'react'

import { Button, Chip, Tooltip, Typography } from '~/components/designSystem'
import { InvoiceCustomerFooterSelection } from '~/components/invoceCustomFooter/InvoiceCustomerFooterSelection'
import { MappedInvoiceSection } from '~/components/invoceCustomFooter/types'
import {
  CustomerAppliedInvoiceCustomSectionsFragmentDoc,
  InvoiceCustomSectionsReferenceInput,
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

export const ADD_BUTTON = 'invoice-custom-footer-add-button'
export const CANCEL_BUTTON = 'invoice-custom-footer-cancel-button'
export const DELETE_SECTION_CHIP = (sectionId: string) =>
  `invoice-custom-footer-delete-section-${sectionId}`

interface InvoceCustomFooterProps {
  customerId: string
  title: string
  description: string
  invoiceCustomSection?: InvoiceCustomSectionsReferenceInput
  setInvoiceCustomSection?: (item: InvoiceCustomSectionsReferenceInput) => void
}

export const InvoceCustomFooter = ({
  customerId,
  title,
  description,
  invoiceCustomSection,
  setInvoiceCustomSection,
}: InvoceCustomFooterProps) => {
  const { translate } = useInternationalization()
  const [invoiceCustomSelected, setInvoiceCustomSelected] = useState<MappedInvoiceSection[]>([])
  const [shouldDisplayCombobox, setShouldDisplayCombobox] = useState(false)
  const { invoiceCustomSectionIds, skipInvoiceCustomSections } = invoiceCustomSection ?? {}

  // eslint-disable-next-line no-console
  console.log(
    'invoiceCustomSection',
    invoiceCustomSectionIds,
    skipInvoiceCustomSections,
    setInvoiceCustomSection,
  )

  const { data } = useGetCustomerAppliedInvoiceCustomSectionsQuery({
    variables: { id: customerId },
    skip: !customerId,
  })

  const customer = data?.customer

  const onChange = (item: MappedInvoiceSection) => {
    const isItemAlreadySelected = invoiceCustomSelected.find(({ id }) => id === item.id)

    if (!isItemAlreadySelected) {
      setInvoiceCustomSelected([...invoiceCustomSelected, item])
    }

    setShouldDisplayCombobox(false)
  }

  const onDelete = (item: MappedInvoiceSection) => {
    const itemsWithoutRemovedItem = invoiceCustomSelected.filter(({ id }) => id !== item.id)

    setInvoiceCustomSelected(itemsWithoutRemovedItem)
  }

  useEffect(() => {
    if (
      customer &&
      customer.configurableInvoiceCustomSections?.length &&
      !customer.skipInvoiceCustomSections
    ) {
      setInvoiceCustomSelected(customer.configurableInvoiceCustomSections)
    }
  }, [customer])

  return (
    <div>
      {title && (
        <Typography variant="captionHl" color="textSecondary">
          {title}
        </Typography>
      )}
      {description && (
        <Typography variant="caption" className="mb-4">
          {description}
        </Typography>
      )}
      <div className="flex flex-col gap-4">
        {invoiceCustomSelected.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {invoiceCustomSelected.map((section) => (
              <Chip
                key={section.id}
                label={section.name}
                data-test={DELETE_SECTION_CHIP(section.id)}
                onDelete={() => onDelete(section)}
              />
            ))}
          </div>
        )}

        {shouldDisplayCombobox ? (
          <div className="flex items-center">
            <div className="flex-1">
              <InvoiceCustomerFooterSelection
                placeholder={translate('text_1762947620814hsqq7d88d7c')}
                emptyText={translate('text_1762952250941g1m9u5hpclb')}
                onChange={onChange}
                invoiceCustomSelected={invoiceCustomSelected}
              />
            </div>

            <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
              <Button
                icon="trash"
                variant="quaternary"
                data-test={CANCEL_BUTTON}
                onClick={() => {
                  setShouldDisplayCombobox(false)
                }}
              />
            </Tooltip>
          </div>
        ) : (
          <Button
            fitContent
            startIcon="plus"
            variant="inline"
            data-test={ADD_BUTTON}
            onClick={() => {
              setShouldDisplayCombobox(true)
            }}
          >
            {translate('text_1762862908777d78m2z5d29a')}
          </Button>
        )}
      </div>
    </div>
  )
}
