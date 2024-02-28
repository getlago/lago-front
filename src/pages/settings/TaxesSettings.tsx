import { gql } from '@apollo/client'
import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

import { Button, InfiniteScroll, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { DeleteTaxDialog, DeleteTaxDialogRef } from '~/components/taxes/DeleteTaxDialog'
import { TaxItem, TaxItemSkeleton } from '~/components/taxes/TaxItem'
import { CREATE_TAX_ROUTE } from '~/core/router'
import { TaxItemFragmentDoc, useGetTaxesQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'
import { NAV_HEIGHT, theme } from '~/styles'
import { SettingsHeaderNameWrapper, SettingsPageContentWrapper } from '~/styles/settingsPage'

gql`
  query getTaxes($limit: Int, $page: Int) {
    taxes(limit: $limit, page: $page, order: "name") {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        ...TaxItem
      }
    }
  }

  ${TaxItemFragmentDoc}
`

const TaxesSettings = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const deleteDialogRef = useRef<DeleteTaxDialogRef>(null)
  const { data, error, loading, fetchMore } = useGetTaxesQuery({
    variables: { limit: 20 },
    notifyOnNetworkStatusChange: true,
  })
  const { metadata, collection } = data?.taxes || {}

  if (!!error && !loading) {
    return (
      <GenericPlaceholder
        title={translate('text_629728388c4d2300e2d380d5')}
        subtitle={translate('text_629728388c4d2300e2d380eb')}
        buttonTitle={translate('text_629728388c4d2300e2d38110')}
        buttonVariant="primary"
        buttonAction={() => location.reload()}
        image={<ErrorImage width="136" height="104" />}
      />
    )
  }

  return (
    <>
      <SettingsHeaderNameWrapper>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_645bb193927b375079d28a8f')}
        </Typography>
      </SettingsHeaderNameWrapper>

      <SettingsPageContentWrapper>
        <Title variant="headline">{translate('text_645bb193927b375079d28ab5')}</Title>
        <Subtitle>{translate('text_645bb193927b375079d28b7e')}</Subtitle>

        <InlineSectionTitle>
          <Typography variant="subhead" color="grey700">
            {translate('text_645bb193927b375079d28ae8')}
          </Typography>
          <Button
            variant="quaternary"
            disabled={loading}
            onClick={() => {
              navigate(CREATE_TAX_ROUTE)
            }}
            data-test="create-tax-button"
          >
            {translate('text_645bb193927b375079d28ad2')}
          </Button>
        </InlineSectionTitle>

        <InfoBlock $hasData={!!collection?.length}>
          {!collection?.length ? (
            <>
              <Typography variant="body" color="grey700" data-test="empty-title">
                {translate('text_645bb193927b375079d28aee')}
              </Typography>
              <Typography variant="caption" color="grey600">
                {translate('text_645ca29272ea80007df9d7af')}
              </Typography>
            </>
          ) : (
            <InfiniteScroll
              onBottom={() => {
                if (!fetchMore) return
                const { currentPage = 0, totalPages = 0 } = metadata || {}

                currentPage < totalPages &&
                  !loading &&
                  fetchMore({
                    variables: { page: currentPage + 1 },
                  })
              }}
            >
              {!!collection &&
                collection.map((tax) => {
                  return (
                    <TaxItem
                      key={`tax-item-${tax.id}`}
                      tax={tax}
                      deleteDialogRef={deleteDialogRef}
                    />
                  )
                })}
              {loading && [0, 1, 2].map((_, i) => <TaxItemSkeleton key={`tax-skeleton-${i}`} />)}
            </InfiniteScroll>
          )}
        </InfoBlock>
      </SettingsPageContentWrapper>

      <DeleteTaxDialog ref={deleteDialogRef} />
    </>
  )
}

const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(2)};
`

const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
`

const InlineSectionTitle = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const InfoBlock = styled.div<{ $hasData?: boolean }>`
  padding-bottom: ${({ $hasData }) => ($hasData ? 0 : theme.spacing(8))};
  box-shadow: ${({ $hasData }) => ($hasData ? 0 : theme.shadows[7])};
`

export default TaxesSettings
