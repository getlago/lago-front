import { gql } from '@apollo/client'
import styled from 'styled-components'
import { DateTime } from 'luxon'

import { CustomerInvoiceListFragment } from '~/generated/graphql'
import { Typography, Button, Tooltip } from '~/components/designSystem'
import { useI18nContext } from '~/core/I18nContext'
import { theme, HEADER_TABLE_HEIGHT, NAV_HEIGHT } from '~/styles'
import { SectionHeader, SideSection } from '~/styles/customer'
import { addToast } from '~/core/apolloClient'
import { intlFormatNumber } from '~/core/intlFormatNumber'

gql`
  fragment CustomerInvoiceList on Invoice {
    id
    issuingDate
    totalAmountCents
    amountCurrency
    plan {
      id
      name
    }
  }
`

interface CustomerInvoicesListProps {
  invoices?: CustomerInvoiceListFragment[] | null
}

export const CustomerInvoicesList = ({ invoices }: CustomerInvoicesListProps) => {
  const { translate } = useI18nContext()

  return (
    <SideSection $empty={!invoices || !invoices.length}>
      <SectionHeader variant="subhead">{translate('text_6250304370f0f700a8fdc291')}</SectionHeader>
      {!invoices || !invoices.length ? (
        <Typography>{translate('text_6250304370f0f700a8fdc293')}</Typography>
      ) : (
        <>
          <ListHeader>
            <IssuingDateCell variant="bodyHl" color="disabled" noWrap>
              {translate('text_62544c1db13ca10187214d7f')}
            </IssuingDateCell>
            <IDCellHeader variant="bodyHl" color="disabled">
              {translate('text_62544c1db13ca10187214d81')}
            </IDCellHeader>
            <PlanCell variant="bodyHl" color="disabled" noWrap>
              {translate('text_62544c1db13ca10187214d83')}
            </PlanCell>
            <AmountCell variant="bodyHl" color="disabled" align="right">
              {translate('text_62544c1db13ca10187214d85')}
            </AmountCell>
          </ListHeader>
          {invoices.map(({ id, issuingDate, totalAmountCents, amountCurrency, plan }) => {
            return (
              <Item key={id}>
                <IssuingDateCell noWrap>
                  {DateTime.fromISO(issuingDate).toFormat('yyyy/LL/dd')}
                </IssuingDateCell>
                <Tooltip placement="top-start" title={translate('text_6253f11816f710014600ba1d')}>
                  <IDCell
                    variant="quaternary"
                    onClick={() => {
                      navigator.clipboard.writeText(id)
                      addToast({
                        severity: 'info',
                        translateKey: 'text_6253f11816f710014600ba1f',
                      })
                    }}
                  >
                    {id}
                  </IDCell>
                </Tooltip>
                <PlanCell color="textSecondary" noWrap>
                  {plan?.name}
                </PlanCell>
                <AmountCell align="right" color="textSecondary">
                  {intlFormatNumber(totalAmountCents, { currency: amountCurrency })}
                </AmountCell>
              </Item>
            )
          })}
        </>
      )}
    </SideSection>
  )
}

const ListHeader = styled.div`
  height: ${HEADER_TABLE_HEIGHT}px;
  display: flex;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
  > *:not(:last-child) {
    margin-right: ${theme.spacing(4)};
  }
`

const IssuingDateCell = styled(Typography)`
  width: 128px;
`
const IDCellHeader = styled(Typography)`
  box-sizing: border-box;
  padding: 0 ${theme.spacing(3)};
  width: 144px;
`

const IDCell = styled(Button)`
  width: 144px;
  white-space: pre;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
`

const PlanCell = styled(Typography)`
  min-width: 50px;
  flex: 1;
`

const AmountCell = styled(Typography)`
  width: 160px;
`

const Item = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
  box-shadow: ${theme.shadows[7]};

  > *:not(:last-child) {
    margin-right: ${theme.spacing(4)};
  }
`
