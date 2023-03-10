import React, { memo, useRef } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { Button, Typography } from '~/components/designSystem'
import {
  CustomerMetadatasForInvoiceOverviewFragment,
  InvoiceMetadatasForInvoiceOverviewFragment,
} from '~/generated/graphql'
import { SectionHeader } from '~/styles/customer'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

import { AddMetadataDrawer, AddMetadataDrawerRef } from './AddMetadataDrawer'

gql`
  fragment CustomerMetadatasForInvoiceOverview on Customer {
    id
    metadata {
      id
      displayInInvoice
      key
      value
    }
  }

  fragment InvoiceMetadatasForInvoiceOverview on Invoice {
    id
    metadata {
      id
      key
      value
    }
  }
`

interface MetadatasProps {
  customer: CustomerMetadatasForInvoiceOverviewFragment
  invoice: InvoiceMetadatasForInvoiceOverviewFragment
}

export const Metadatas = memo(({ customer, invoice }: MetadatasProps) => {
  const { translate } = useInternationalization()
  const addMetadataDrawerDialogRef = useRef<AddMetadataDrawerRef>(null)
  const customerMetadatas = (customer?.metadata || []).filter((m) => m.displayInInvoice)

  return (
    <>
      <Wrapper>
        <StyledSectionHeader variant="subhead">
          {translate('id_6405e8dd5593b00054e31c55')}
          <Button
            variant="quaternary"
            align="left"
            onClick={() => {
              addMetadataDrawerDialogRef?.current?.openDrawer()
            }}
          >
            {translate(
              !!invoice.metadata?.length
                ? 'id_6405e8dd5593b00054e31d25'
                : 'id_6405e8dd5593b00054e31c54'
            )}
          </Button>
        </StyledSectionHeader>
        <div>
          {invoice?.metadata?.length ? (
            invoice?.metadata.map((metadata) => (
              <InfoLine key={`customer-metadata-${metadata.id}`}>
                <Typography variant="caption" color="grey600" noWrap>
                  {metadata.key}
                </Typography>
                <Typography variant="body" color="grey700">
                  {metadata.value}
                </Typography>
              </InfoLine>
            ))
          ) : (
            <Typography variant="body" color="grey500">
              {translate('id_6405e8dd5593b00054e31c56')}
            </Typography>
          )}
        </div>
        {!!customerMetadatas.length && (
          <>
            <StyledSectionHeader variant="subhead">
              {translate('id_6405e8dd5593b00054e31bff')}
            </StyledSectionHeader>
            <div>
              {customerMetadatas.map((metadata) => (
                <InfoLine key={`customer-metadata-${metadata.id}`}>
                  <Typography variant="caption" color="grey600" noWrap>
                    {metadata.key}
                  </Typography>
                  <Typography variant="body" color="grey700">
                    {metadata.value}
                  </Typography>
                </InfoLine>
              ))}
            </div>
          </>
        )}
      </Wrapper>

      <AddMetadataDrawer ref={addMetadataDrawerDialogRef} invoice={invoice} />
    </>
  )
})

Metadatas.displayName = 'Metadatas'

const Wrapper = styled.section`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

const StyledSectionHeader = styled(SectionHeader)`
  margin-top: ${theme.spacing(8)};
`

const InfoLine = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: ${theme.spacing(3)};

  > div:first-child {
    min-width: 232px;
    margin-right: ${theme.spacing(3)};
    line-height: 28px;
  }

  > div:last-child {
    width: 100%;
    line-break: anywhere;
  }
`
