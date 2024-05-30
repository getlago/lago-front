import { gql } from '@apollo/client'
import { RefObject } from 'react'
import { generatePath, Link, useNavigate } from 'react-router-dom'
import styled, { css } from 'styled-components'

import { Button, Popper, Skeleton, Tooltip, Typography } from '~/components/designSystem'
import { addToast } from '~/core/apolloClient'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CUSTOMER_INVOICE_DETAILS_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  CreditNoteForCreditNoteListItemFragment,
  CreditNoteForVoidCreditNoteDialogFragmentDoc,
  useDownloadCreditNoteItemMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { ListKeyNavigationItemProps } from '~/hooks/ui/useListKeyNavigation'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import { CustomerInvoiceDetailsTabsOptionsEnum } from '~/layouts/CustomerInvoiceDetails'
import {
  BaseListItem,
  ItemContainer,
  ListItemLink,
  MenuPopper,
  NAV_HEIGHT,
  PopperOpener,
  theme,
} from '~/styles'

import { VoidCreditNoteDialogRef } from '../customers/creditNotes/VoidCreditNoteDialog'

gql`
  fragment CreditNoteForCreditNoteListItem on CreditNote {
    id
    number
    totalAmountCents
    currency
    createdAt
    canBeVoided
    invoice {
      id
      number
      customer {
        id
        name
      }
    }
  }

  mutation downloadCreditNoteItem($input: DownloadCreditNoteInput!) {
    downloadCreditNote(input: $input) {
      id
      fileUrl
    }
  }

  ${CreditNoteForVoidCreditNoteDialogFragmentDoc}
`

export enum CreditNoteListItemContextEnum {
  customer = 'customer',
  organization = 'organization',
}

interface CreditNoteListItemProps {
  creditNote: CreditNoteForCreditNoteListItemFragment
  navigationProps?: ListKeyNavigationItemProps
  to: string
  voidCreditNoteDialogRef: RefObject<VoidCreditNoteDialogRef>
}

export const CreditNoteListItem = ({
  creditNote,
  navigationProps,
  to,
  voidCreditNoteDialogRef,
  ...props
}: CreditNoteListItemProps) => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { formatTimeOrgaTZ } = useOrganizationInfos()
  const { hasPermissions } = usePermissions()
  // const statusConfig = mapStatusConfig(status, paymentStatus)

  const [downloadCreditNote, { loading: loadingCreditNoteDownload }] =
    useDownloadCreditNoteItemMutation({
      onCompleted({ downloadCreditNote: data }) {
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
        } else {
          addToast({
            severity: 'danger',
            translateKey: 'text_62b31e1f6a5b8b1b745ece48',
          })
        }
      },
    })

  return (
    <ItemContainer {...props}>
      <Item to={to} tabIndex={0} {...navigationProps}>
        <GridItem>
          <Typography variant="captionCode" color="grey700" noWrap>
            {creditNote.number}
          </Typography>
          <Typography variant="captionCode" color="grey700" noWrap>
            <Link
              to={generatePath(CUSTOMER_INVOICE_DETAILS_ROUTE, {
                customerId: creditNote.invoice?.customer?.id as string,
                invoiceId: creditNote.invoice?.id as string,
                tab: CustomerInvoiceDetailsTabsOptionsEnum.overview,
              })}
            >
              {creditNote.invoice?.number}
            </Link>
          </Typography>
          <CustomerColumn variant="body" color="grey700" noWrap>
            {creditNote.invoice?.customer?.name}
          </CustomerColumn>
          <Typography variant="body" color="success600" align="right" noWrap>
            {intlFormatNumber(
              deserializeAmount(creditNote.totalAmountCents || 0, creditNote.currency),
              {
                currencyDisplay: 'symbol',
                currency: creditNote.currency,
              },
            )}
          </Typography>
          <Typography variant="body" color="grey700" noWrap>
            {formatTimeOrgaTZ(creditNote.createdAt)}
          </Typography>
        </GridItem>
        <div />
      </Item>
      <Popper
        PopperProps={{ placement: 'bottom-end' }}
        opener={({ isOpen }) => (
          <DotsOpener>
            <Tooltip
              placement="top-end"
              disableHoverListener={isOpen}
              title={translate(
                creditNote.canBeVoided && hasPermissions(['creditNotesVoid'])
                  ? 'text_63728c6434e1344aea76347d'
                  : 'text_63728c6434e1344aea76347f',
              )}
            >
              <Button icon="dots-horizontal" variant="quaternary" />
            </Tooltip>
          </DotsOpener>
        )}
      >
        {({ closePopper }) => (
          <MenuPopper>
            {hasPermissions(['creditNotesView']) && (
              <Button
                variant="quaternary"
                align="left"
                disabled={loadingCreditNoteDownload}
                onClick={async () => {
                  await downloadCreditNote({
                    variables: { input: { id: creditNote.id } },
                  })
                  closePopper()
                }}
              >
                {translate('text_636d12ce54c41fccdf0ef72d')}
              </Button>
            )}
            {creditNote.canBeVoided && hasPermissions(['creditNotesVoid']) && (
              <Button
                variant="quaternary"
                align="left"
                onClick={async () => {
                  voidCreditNoteDialogRef.current?.openDialog({
                    id: creditNote.id,
                    totalAmountCents: creditNote.totalAmountCents,
                    currency: creditNote.currency,
                  })
                  closePopper()
                }}
              >
                {translate('text_636d12ce54c41fccdf0ef72f')}
              </Button>
            )}
            <Button
              variant="quaternary"
              align="left"
              onClick={() => {
                copyToClipboard(creditNote.id)

                addToast({
                  severity: 'info',
                  translateKey: 'text_63720bd734e1344aea75b82d',
                })
                closePopper()
              }}
            >
              {translate('text_636d12ce54c41fccdf0ef731')}
            </Button>
          </MenuPopper>
        )}
      </Popper>
    </ItemContainer>
  )
}

export default CreditNoteListItem

export const CreditNoteListItemSkeleton = () => {
  return (
    <SkeletonLine>
      <Skeleton variant="text" width={180} height={12} />
      <Skeleton variant="text" width={80} height={12} />
      <Skeleton variant="text" width={160} height={12} />
      <RightSkeleton variant="text" width={160} height={12} />
      <Skeleton variant="text" width={112} height={12} />
      <Skeleton variant="text" width={40} height={12} />
    </SkeletonLine>
  )
}

export const CreditNotesListItemGridTemplate = () => css`
  display: grid;
  grid-template-columns: minmax(200px, auto) minmax(160px, auto) 1fr 1fr 112px 40px;
  gap: ${theme.spacing(3)};

  ${theme.breakpoints.down('md')} {
    grid-template-columns: minmax(200px, auto) minmax(160px, auto) 1fr 112px 40px;
  }
`

const Grid = () => css`
  position: relative;
  align-items: center;
  width: 100%;
  ${CreditNotesListItemGridTemplate()}
`

const GridItem = styled.div`
  ${Grid()}
`

const SkeletonLine = styled(BaseListItem)`
  ${Grid()}
`

const Item = styled(ListItemLink)`
  position: relative;
`

const DotsOpener = styled(PopperOpener)`
  position: absolute;
  right: 12;
  top: ${NAV_HEIGHT / 2 - 20}px;
  z-index: 1;

  ${theme.breakpoints.down('md')} {
    right: ${theme.spacing(4)};
  }
`

const RightSkeleton = styled(Skeleton)`
  display: flex;
  justify-self: end;

  ${theme.breakpoints.down('md')} {
    display: none;
  }
`

const CustomerColumn = styled(Typography)`
  ${theme.breakpoints.down('md')} {
    display: none;
  }
`
