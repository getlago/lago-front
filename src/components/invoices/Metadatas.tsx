import React, { memo } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { Typography } from '~/components/designSystem'
import { Customer, InvoiceForDetailsTableFooterFragmentDoc } from '~/generated/graphql'
import { SectionHeader } from '~/styles/customer'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme } from '~/styles'

gql`
  fragment InvoiceMetadatasForInvoiceOverview on Invoice {
    id
    customer {
      id
      metadata {
        id
        displayInInvoice
        key
        value
      }
    }
  }

  ${InvoiceForDetailsTableFooterFragmentDoc}
`

interface MetadatasProps {
  customer: Customer
}

export const Metadatas = memo(({ customer }: MetadatasProps) => {
  const { translate } = useInternationalization()
  const customerMetadatas = (customer?.metadata || []).filter((m) => m.displayInInvoice)

  return (
    <Wrapper>
      <SectionHeader variant="subhead">{translate('text_63fdc19535d4e3bba3b9c070')}</SectionHeader>
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
    </Wrapper>
  )
})

Metadatas.displayName = 'Metadatas'

const Wrapper = styled.section`
  margin-top: ${theme.spacing(8)};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }
`

const InfoLine = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${theme.spacing(3)};

  > div:first-child {
    min-width: 232px;
    margin-right: ${theme.spacing(3)};
  }

  > div:last-child {
    width: 100%;
  }
`
