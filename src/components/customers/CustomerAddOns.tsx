/* eslint-disable react/prop-types */
import { forwardRef, memo, MutableRefObject } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'

import { CustomerAddOnsFragment, TimezoneEnum } from '~/generated/graphql'
import { SectionHeader } from '~/styles/customer'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Typography, Avatar, Icon, Button } from '~/components/designSystem'
import { theme, HEADER_TABLE_HEIGHT, NAV_HEIGHT } from '~/styles'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { TimezoneDate } from '~/components/TimezoneDate'

import { AddAddOnToCustomerDialogRef } from './AddAddOnToCustomerDialog'

gql`
  fragment CustomerAddOns on AppliedAddOn {
    id
    amountCents
    amountCurrency
    createdAt
    addOn {
      id
      name
    }
  }
`

interface CustomerAddOnsProps {
  addOns?: CustomerAddOnsFragment[] | null | undefined
  customerTimezone: TimezoneEnum
}

export const CustomerAddOns = memo(
  forwardRef<AddAddOnToCustomerDialogRef, CustomerAddOnsProps>(
    ({ addOns, customerTimezone }: CustomerAddOnsProps, ref) => {
      const { translate } = useInternationalization()

      return (
        <>
          {!!(addOns || [])?.length && (
            <Container>
              <SectionHeader variant="subhead">
                {translate('text_629781ec7c6c1500d94fbbfe')}
                <Button
                  variant="quaternary"
                  onClick={() =>
                    (ref as MutableRefObject<AddAddOnToCustomerDialogRef>)?.current?.openDialog()
                  }
                >
                  {translate('text_629781ec7c6c1500d94fbbf8')}
                </Button>
              </SectionHeader>
              <ListHeader>
                <Typography variant="bodyHl" color="disabled" noWrap>
                  {translate('text_629781ec7c6c1500d94fbc04')}
                </Typography>
                <Typography variant="bodyHl" color="disabled" noWrap>
                  {translate('text_629781ec7c6c1500d94fbc0a')}
                </Typography>
              </ListHeader>
              {(addOns || []).map(({ amountCents, amountCurrency, id, addOn, createdAt }) => (
                <Item key={id}>
                  <NameSection>
                    <ListAvatar variant="connector">
                      <Icon name="puzzle" color="dark" />
                    </ListAvatar>
                    <NameBlock>
                      <Typography color="textSecondary" variant="bodyHl" noWrap>
                        {addOn?.name}
                      </Typography>
                      <Typography variant="caption" noWrap>
                        {translate('text_629781ec7c6c1500d94fbc16', {
                          amountWithCurrency: intlFormatNumber(amountCents || 0, {
                            currencyDisplay: 'symbol',
                            currency: amountCurrency,
                          }),
                        })}
                      </Typography>
                    </NameBlock>
                  </NameSection>
                  <TimezoneDate date={createdAt} customerTimezone={customerTimezone} />
                </Item>
              ))}
            </Container>
          )}
        </>
      )
    }
  )
)

const Container = styled.div`
  display: flex;
  flex-direction: column;
`

const ListHeader = styled.div`
  height: ${HEADER_TABLE_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: ${theme.shadows[7]};
  > *:not(:last-child) {
    margin-right: ${theme.spacing(6)};
  }
`

const NameSection = styled.div`
  margin-right: auto;
  display: flex;
  align-items: center;
  min-width: 0;
  height: ${NAV_HEIGHT}px;
  flex: 1;
`

const ListAvatar = styled(Avatar)`
  margin-right: ${theme.spacing(3)};
`

const NameBlock = styled.div`
  min-width: 0;
`

const Item = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
`

CustomerAddOns.displayName = 'CustomerAddOns'
