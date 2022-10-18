import { gql } from '@apollo/client'
import styled from 'styled-components'
import { DateTime } from 'luxon'
import { generatePath, useNavigate } from 'react-router-dom'

import {
  CustomerInvoiceListFragment,
  InvoiceStatusTypeEnum,
  useDownloadInvoiceMutation,
} from '~/generated/graphql'
import { Button, Popper, Status, StatusEnum, Tooltip, Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  HEADER_TABLE_HEIGHT,
  ItemContainer,
  MenuPopper,
  NAV_HEIGHT,
  PopperOpener,
  theme,
} from '~/styles'
import { SectionHeader, SideSection } from '~/styles/customer'
import { addToast } from '~/core/apolloClient'
import { intlFormatNumber } from '~/core/intlFormatNumber'
import { CUSTOMER_INVOICE_DETAILS_ROUTE } from '~/core/router'

gql`
  fragment CustomerInvoiceList on Invoice {
    id
    amountCurrency
    issuingDate
    number
    status
    totalAmountCents
  }

  mutation downloadInvoice($input: DownloadInvoiceInput!) {
    downloadInvoice(input: $input) {
      id
      fileUrl
    }
  }
`

interface CustomerInvoicesListProps {
  customerId: string
  invoices?: CustomerInvoiceListFragment[] | null
}

const mapStatus = (type?: InvoiceStatusTypeEnum | undefined) => {
  switch (type) {
    case InvoiceStatusTypeEnum.Succeeded:
      return {
        type: StatusEnum.running,
        label: 'text_62b31e1f6a5b8b1b745ece18',
      }
    case InvoiceStatusTypeEnum.Failed:
      return {
        type: StatusEnum.failed,
        label: 'text_62b31e1f6a5b8b1b745ece38',
      }
    default:
      return {
        type: StatusEnum.paused,
        label: 'text_62b31e1f6a5b8b1b745ece28',
      }
  }
}

export const CustomerInvoicesList = ({ customerId, invoices }: CustomerInvoicesListProps) => {
  let navigate = useNavigate()
  const { translate } = useInternationalization()
  const [downloadInvoice] = useDownloadInvoiceMutation({
    onCompleted({ downloadInvoice: data }) {
      const fileUrl = data?.fileUrl

      if (fileUrl) {
        // We open a window, add url then focus on different lines, in order to prevent browsers to block page opening
        // It could be seen as unexpected popup as not immediatly done on user action
        // https://stackoverflow.com/questions/2587677/avoid-browser-popup-blockers
        const myWindow = window.open('', '_blank')

        if (myWindow?.location?.href) {
          myWindow.location.href = fileUrl
          return myWindow?.focus()
        }

        myWindow?.close()
        addToast({
          severity: 'danger',
          translateKey: 'text_62b31e1f6a5b8b1b745ece48',
        })
      }
    },
  })

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
            <NumberCellHeader variant="bodyHl" color="disabled">
              {translate('text_62b31e1f6a5b8b1b745ece00')}
            </NumberCellHeader>
            <AmountCell variant="bodyHl" color="disabled" align="right">
              {translate('text_62544c1db13ca10187214d85')}
            </AmountCell>
            <PaymentCell variant="bodyHl" color="disabled" noWrap>
              {translate('text_62b31e1f6a5b8b1b745ece08')}
            </PaymentCell>
            <ButtonMock />
          </ListHeader>
          {invoices.map(({ amountCurrency, id, issuingDate, number, totalAmountCents, status }) => {
            const formattedStatus = mapStatus(status)

            return (
              <ItemContainer key={`invoice-${id}`}>
                <Item
                  tabIndex={0}
                  onClick={() =>
                    navigate(
                      generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
                        id: customerId,
                        invoiceId: id,
                      })
                    )
                  }
                >
                  <IssuingDateCell noWrap>
                    {DateTime.fromISO(issuingDate).toFormat('LLL. dd, yyyy')}
                  </IssuingDateCell>
                  <NumberCell color="textSecondary">{number}</NumberCell>
                  <AmountCell color="textSecondary" align="right">
                    {intlFormatNumber(totalAmountCents, { currency: amountCurrency })}
                  </AmountCell>
                  <PaymentCell>
                    <Status type={formattedStatus.type} label={translate(formattedStatus.label)} />
                  </PaymentCell>
                  <ButtonMock />
                </Item>
                <Popper
                  PopperProps={{ placement: 'bottom-end' }}
                  opener={({ isOpen }) => (
                    <DotsOpener>
                      <Tooltip
                        placement="top-end"
                        disableHoverListener={isOpen}
                        title={translate('text_62b31e1f6a5b8b1b745ece3c')}
                      >
                        <Button icon="dots-horizontal" variant="quaternary" />
                      </Tooltip>
                    </DotsOpener>
                  )}
                >
                  {({ closePopper }) => (
                    <MenuPopper>
                      <Button
                        startIcon="download"
                        variant="quaternary"
                        align="left"
                        onClick={async () => {
                          await downloadInvoice({
                            variables: { input: { id } },
                          })
                        }}
                      >
                        {translate('text_62b31e1f6a5b8b1b745ece42')}
                      </Button>
                      <Button
                        startIcon="duplicate"
                        variant="quaternary"
                        align="left"
                        onClick={() => {
                          navigator.clipboard.writeText(id)
                          addToast({
                            severity: 'info',
                            translateKey: 'text_6253f11816f710014600ba1f',
                          })
                          closePopper()
                        }}
                      >
                        {translate('text_62b31e1f6a5b8b1b745ece46')}
                      </Button>
                    </MenuPopper>
                  )}
                </Popper>
              </ItemContainer>
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
  min-width: 100px;
`
const NumberCellHeader = styled(Typography)`
  box-sizing: border-box;
  flex: 1;
`

const NumberCell = styled(Typography)`
  flex: 1;
  white-space: pre;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
`

const PaymentCell = styled(Typography)`
  width: 112px;

  > *:not(:last-child) {
    margin-right: ${theme.spacing(4)};
  }
`

const AmountCell = styled(Typography)`
  flex: 1;
`

const ButtonMock = styled.div`
  width: 40px;
`

const DotsOpener = styled(PopperOpener)`
  right: 0;
`

const Item = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
  box-shadow: ${theme.shadows[7]};

  > *:not(:last-child) {
    margin-right: ${theme.spacing(4)};
  }

  &:hover {
    cursor: pointer;
    background-color: ${theme.palette.grey[100]};
  }
`
