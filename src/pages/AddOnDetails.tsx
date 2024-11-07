import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'

import { DeleteAddOnDialog, DeleteAddOnDialogRef } from '~/components/addOns/DeleteAddOnDialog'
import { Button, Popper, Skeleton, Typography } from '~/components/designSystem'
import { DetailsHeader, DetailsHeaderSkeleton } from '~/components/details/DetailsHeader'
import DetailsTableDisplay from '~/components/details/DetailsTableDisplay'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { ADD_ONS_ROUTE, UPDATE_ADD_ON_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CurrencyEnum, useGetAddOnForDetailsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import { MenuPopper, PageHeader, theme } from '~/styles'
import { DetailsInfoGrid, DetailsSectionTitle } from '~/styles/detailsPage'

gql`
  query getAddOnForDetails($addOn: ID!) {
    addOn(id: $addOn) {
      id
      name
      amountCents
      amountCurrency
      code
      taxes {
        id
        code
        name
        rate
      }
    }
  }
`

const AddOnDetails = () => {
  const navigate = useNavigate()
  const { hasPermissions } = usePermissions()
  const { translate } = useInternationalization()
  const { addOnId } = useParams()

  const deleteDialogRef = useRef<DeleteAddOnDialogRef>(null)

  const { data: addOnResult, loading: isAddOnLoading } = useGetAddOnForDetailsQuery({
    variables: {
      addOn: addOnId as string,
    },
  })

  const addOn = addOnResult?.addOn

  const amountWithCurrency = intlFormatNumber(
    deserializeAmount(addOn?.amountCents, addOn?.amountCurrency || CurrencyEnum.Usd) || 0,
    {
      currencyDisplay: 'symbol',
      currency: addOn?.amountCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 15,
    },
  )

  const shouldShowActions = hasPermissions(['addonsCreate', 'addonsUpdate', 'addonsDelete'])

  return (
    <>
      <PageHeader $withSide>
        <HeaderInlineBreadcrumbBlock>
          <Button
            icon="arrow-left"
            variant="quaternary"
            onClick={() => {
              navigate(ADD_ONS_ROUTE)
            }}
          />
          {isAddOnLoading && !addOn ? (
            <AddOnTitleLoadingWrapper>
              <Skeleton variant="text" width={200} />
            </AddOnTitleLoadingWrapper>
          ) : (
            <Typography
              variant="bodyHl"
              color="textSecondary"
              noWrap
              data-test="addon-details-name"
            >
              {addOn?.name}
            </Typography>
          )}
          <Typography variant="bodyHl" color="textSecondary" noWrap></Typography>
        </HeaderInlineBreadcrumbBlock>

        {shouldShowActions && (
          <Popper
            PopperProps={{ placement: 'bottom-end' }}
            opener={
              <Button endIcon="chevron-down" data-test="addon-details-actions">
                {translate('text_626162c62f790600f850b6fe')}
              </Button>
            }
          >
            {({ closePopper }) => (
              <MenuPopper>
                <Button
                  data-test="addon-details-edit"
                  variant="quaternary"
                  align="left"
                  onClick={() => {
                    navigate(generatePath(UPDATE_ADD_ON_ROUTE, { addOnId: addOnId as string }))
                    closePopper()
                  }}
                >
                  {translate('text_625fd39a15394c0117e7d792')}
                </Button>
                {addOn && (
                  <Button
                    variant="quaternary"
                    align="left"
                    onClick={() => {
                      deleteDialogRef.current?.openDialog({
                        addOn,
                        callback: () => {
                          navigate(ADD_ONS_ROUTE)
                        },
                      })
                      closePopper()
                    }}
                  >
                    {translate('text_629728388c4d2300e2d38182')}
                  </Button>
                )}
              </MenuPopper>
            )}
          </Popper>
        )}
      </PageHeader>
      {isAddOnLoading ? (
        <DetailsHeaderSkeleton />
      ) : (
        <DetailsHeader
          icon="puzzle"
          title={addOn?.name || ''}
          description={translate('text_629728388c4d2300e2d3810b', { amountWithCurrency })}
        />
      )}
      <Container>
        <section>
          <DetailsSectionTitle variant="subhead" noWrap>
            {translate('text_6627e7b9732dbfb6c472e027')}
          </DetailsSectionTitle>
          <DetailsInfoGrid
            grid={[
              {
                label: translate('text_629728388c4d2300e2d380bd'),
                value: addOn?.name,
              },
              {
                label: translate('text_6627e7b9732dbfb6c472e02d'),
                value: addOn?.code,
              },
              {
                label: translate('text_632b4acf0c41206cbcb8c324'),
                value: addOn?.amountCurrency,
              },
            ]}
          />
        </section>

        <section>
          <DetailsSectionTitle variant="subhead" noWrap>
            {translate('text_629728388c4d2300e2d38117')}
          </DetailsSectionTitle>
          <DetailsCard>
            <DetailsSectionWrapperWithBorder>
              <DetailsTableDisplay
                header={[translate('text_624453d52e945301380e49b6')]}
                body={[[amountWithCurrency]]}
              />
            </DetailsSectionWrapperWithBorder>

            <DetailsSectionWrapper>
              <DetailsInfoGrid
                grid={[
                  {
                    label: translate('text_64be910fba8ef9208686a8e3'),
                    value: !!addOn?.taxes?.length
                      ? addOn.taxes?.map((tax, taxIndex) => (
                          <div key={`add-on-details-tax-${taxIndex}`}>
                            {tax.name} (
                            {intlFormatNumber(Number(tax.rate) / 100 || 0, {
                              style: 'percent',
                            })}
                            )
                          </div>
                        ))
                      : '-',
                  },
                ]}
              />
            </DetailsSectionWrapper>
          </DetailsCard>
        </section>
      </Container>
      <DeleteAddOnDialog ref={deleteDialogRef} />
    </>
  )
}

export default AddOnDetails

const HeaderInlineBreadcrumbBlock = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(3)};

  /* Prevent long name to not overflow in header */
  overflow: hidden;
`

const Container = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing(12)};

  padding: 0 ${theme.spacing(12)};
  max-width: 672px;
`

const AddOnTitleLoadingWrapper = styled.div`
  width: 200px;
`

const DetailsCard = styled.div`
  border: 1px solid ${theme.palette.grey[400]};
  border-radius: 12px;
`

const DetailsSectionWrapper = styled.div`
  padding: ${theme.spacing(4)};
`

const DetailsSectionWrapperWithBorder = styled(DetailsSectionWrapper)`
  box-shadow: ${theme.shadows[7]};
`
