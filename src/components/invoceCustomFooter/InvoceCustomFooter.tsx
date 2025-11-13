import { gql } from '@apollo/client'
import { useEffect, useState } from 'react'

import { Button, Chip, Tooltip, Typography } from '~/components/designSystem'
import { InvoiceCustomerFooterSelection } from '~/components/invoceCustomFooter/InvoiceCustomerFooterSelection'
import { MappedInvoiceSection } from '~/components/invoceCustomFooter/types'
import { useInvoiceCustomSectionsIntersection } from '~/components/invoceCustomFooter/useInvoiceCustomSectionsIntersection'
import {
  CustomerAppliedInvoiceCustomSectionsFragmentDoc,
  useGetCustomerAppliedInvoiceCustomSectionsQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useInvoiceCustomSections } from '~/hooks/useInvoiceCustomSections'

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
  const [selectedSections, setSelectedSections] = useState<MappedInvoiceSection[]>([])
  const [shouldDisplayInvoiceCustomerFooterInput, setShouldDisplayInvoiceCustomerFooterInput] =
    useState(false)

  const { data: orgInvoiceSectionsData, loading: isLoadingOrgInvoiceSections } =
    useInvoiceCustomSections()

  const { data: customerData } = useGetCustomerAppliedInvoiceCustomSectionsQuery({
    variables: { id: customerId },
    skip: !customerId,
  })

  const { intersection, intersectionKey } = useInvoiceCustomSectionsIntersection({
    orgInvoiceSections: orgInvoiceSectionsData || [],
    customerInvoiceSections: customerData?.customer?.configurableInvoiceCustomSections || [],
  })

  const onChange = (id: string) => {
    const newSection = orgInvoiceSectionsData?.find((section) => section.id === id)

    if (newSection) {
      setSelectedSections([...selectedSections, { id: newSection.id, name: newSection.name }])
    }

    setShouldDisplayInvoiceCustomerFooterInput(false)
  }

  const handleRemoveSection = (sectionId: string) => {
    const deletedSections = selectedSections.filter(({ id }) => id !== sectionId)

    setSelectedSections(deletedSections)
  }

  // Using intersectionKey (string) as dependency avoids infinite loops
  useEffect(() => {
    setSelectedSections(intersection)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intersectionKey])

  return (
    <div>
      <Typography variant="captionHl" color="textSecondary">
        {translate('text_17628623882713knw0jtohiw')}
      </Typography>
      <Typography variant="caption" className="mb-4">
        {translate('text_1762862855282gldrtploh46')}
      </Typography>
      <div className="flex flex-col gap-4">
        {selectedSections.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedSections.map((section) => (
              <Chip
                key={section.id}
                label={section.name}
                onDelete={() => handleRemoveSection(section.id)}
              />
            ))}
          </div>
        )}

        {!shouldDisplayInvoiceCustomerFooterInput ? (
          <Button
            fitContent
            startIcon="plus"
            variant="inline"
            onClick={() => {
              setShouldDisplayInvoiceCustomerFooterInput(true)
            }}
          >
            {translate('text_1762862908777d78m2z5d29a')}
          </Button>
        ) : (
          <div className="flex items-center">
            <div className="flex-1">
              <InvoiceCustomerFooterSelection
                loading={isLoadingOrgInvoiceSections}
                data={orgInvoiceSectionsData || []}
                placeholder={translate('text_1762947620814hsqq7d88d7c')}
                emptyText={translate('text_1762952250941g1m9u5hpclb')}
                onChange={onChange}
                selectedSections={selectedSections}
              />
            </div>

            <Tooltip placement="top-end" title={translate('text_63aa085d28b8510cd46443ff')}>
              <Button
                icon="trash"
                variant="quaternary"
                onClick={() => {
                  setShouldDisplayInvoiceCustomerFooterInput(false)
                }}
              />
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  )
}
