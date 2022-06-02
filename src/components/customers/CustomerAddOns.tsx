/* eslint-disable react/prop-types */
import { forwardRef, memo, MutableRefObject } from 'react'
import { gql } from '@apollo/client'
import styled from 'styled-components'
import { DateTime } from 'luxon'

import { CustomerAddOnsFragment } from '~/generated/graphql'
import { SectionHeader } from '~/styles/customer'
import { useI18nContext } from '~/core/I18nContext'
import { Typography, Avatar, Icon, Button } from '~/components/designSystem'
import { theme, HEADER_TABLE_HEIGHT, NAV_HEIGHT } from '~/styles'
import { formatAmountToCurrency } from '~/core/currencyTool'

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
}

export const CustomerAddOns = memo(
  forwardRef<AddAddOnToCustomerDialogRef, CustomerAddOnsProps>(
    ({ addOns }: CustomerAddOnsProps, ref) => {
      const { translate } = useI18nContext()

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
                          amountWithCurrency: formatAmountToCurrency(amountCents || 0, {
                            currencyDisplay: 'code',
                            currency: amountCurrency,
                          }),
                        })}
                      </Typography>
                    </NameBlock>
                  </NameSection>
                  <Typography color="textSecondary" variant="body" noWrap>
                    {DateTime.fromISO(createdAt).toFormat('yyyy/LL/dd')}
                  </Typography>
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
