import { gql } from '@apollo/client'
import { useRef } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'

import { DeleteAddOnDialog, DeleteAddOnDialogRef } from '~/components/addOns/DeleteAddOnDialog'
import { Button, Card, Popper, Skeleton, Typography } from '~/components/designSystem'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { ADD_ONS_ROUTE, UPDATE_ADD_ON_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { CurrencyEnum, useGetAddOnForDetailsQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { usePermissions } from '~/hooks/usePermissions'
import { MenuPopper, PageHeader } from '~/styles'

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
      <PageHeader.Wrapper withSide>
        <PageHeader.Group className="overflow-hidden">
          <Button
            icon="arrow-left"
            variant="quaternary"
            onClick={() => {
              navigate(ADD_ONS_ROUTE)
            }}
          />
          {isAddOnLoading && !addOn ? (
            <Skeleton variant="text" className="w-50" />
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
        </PageHeader.Group>

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
      </PageHeader.Wrapper>

      <DetailsPage.Header
        isLoading={isAddOnLoading}
        icon="puzzle"
        title={addOn?.name || ''}
        description={translate('text_629728388c4d2300e2d3810b', { amountWithCurrency })}
      />

      <DetailsPage.Container>
        <section>
          <DetailsPage.SectionTitle variant="subhead1" noWrap>
            {translate('text_6627e7b9732dbfb6c472e027')}
          </DetailsPage.SectionTitle>
          <DetailsPage.InfoGrid
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
          <DetailsPage.SectionTitle variant="subhead1" noWrap>
            {translate('text_629728388c4d2300e2d38117')}
          </DetailsPage.SectionTitle>
          <Card className="gap-0 p-0">
            <div className="p-4 shadow-b">
              <DetailsPage.TableDisplay
                name="addon-settings"
                header={[translate('text_624453d52e945301380e49b6')]}
                body={[[amountWithCurrency]]}
              />
            </div>

            <div className="p-4">
              <DetailsPage.InfoGrid
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
            </div>
          </Card>
        </section>
      </DetailsPage.Container>

      <DeleteAddOnDialog ref={deleteDialogRef} />
    </>
  )
}

export default AddOnDetails
