import { useNavigate, useSearchParams } from 'react-router-dom'
import styled, { css } from 'styled-components'

import { Button, Typography } from '~/components/designSystem'
import { InvoiceListStatusEnum } from '~/components/invoices/types'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { palette } from '~/styles'

export const InvoiceStatusQuickFilter = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  let [searchParams] = useSearchParams()
  const selectedStatus = searchParams.get('invoiceType')
  const hasOnlyStatusFilter = !!selectedStatus && searchParams.size === 1

  return (
    <>
      <QuickFilter
        variant="tertiary"
        align="left"
        $isSelected={searchParams.size === 0}
        onClick={() => navigate({ search: '' })}
      >
        <Typography variant="captionHl" color="grey600">
          {translate('text_63ac86d797f728a87b2f9f8b')}
        </Typography>
      </QuickFilter>
      <QuickFilter
        variant="tertiary"
        align="left"
        $isSelected={hasOnlyStatusFilter && selectedStatus === InvoiceListStatusEnum.draft}
        // This should set status to "draft"
        onClick={() => navigate({ search: `?invoiceType=${InvoiceListStatusEnum.draft}` })}
      >
        <Typography variant="captionHl" color="grey600">
          {translate('text_63ac86d797f728a87b2f9f91')}
        </Typography>
      </QuickFilter>
      <QuickFilter
        variant="tertiary"
        align="left"
        $isSelected={hasOnlyStatusFilter && selectedStatus === InvoiceListStatusEnum.outstanding}
        // This should set paymentStatus to ["failed", "pending"]
        onClick={() => navigate({ search: `?invoiceType=${InvoiceListStatusEnum.outstanding}` })}
      >
        <Typography variant="captionHl" color="grey600">
          {translate('text_666c5b12fea4aa1e1b26bf52')}
        </Typography>
      </QuickFilter>
      <QuickFilter
        variant="tertiary"
        align="left"
        $isSelected={hasOnlyStatusFilter && selectedStatus === InvoiceListStatusEnum.overdue}
        // This should set paymentOverdue to true
        onClick={() => navigate({ search: `?invoiceType=${InvoiceListStatusEnum.overdue}` })}
      >
        <Typography variant="captionHl" color="grey600">
          {translate('text_666c5b12fea4aa1e1b26bf55')}
        </Typography>
      </QuickFilter>
      <QuickFilter
        variant="tertiary"
        align="left"
        $isSelected={hasOnlyStatusFilter && selectedStatus === InvoiceListStatusEnum.succeeded}
        // This should set paymentStatus: "succeeded" & status: "finalized"
        onClick={() => navigate({ search: `?invoiceType=${InvoiceListStatusEnum.succeeded}` })}
      >
        <Typography variant="captionHl" color="grey600">
          {translate('text_63ac86d797f728a87b2f9fa1')}
        </Typography>
      </QuickFilter>
      <QuickFilter
        variant="tertiary"
        align="left"
        $isSelected={hasOnlyStatusFilter && selectedStatus === InvoiceListStatusEnum.voided}
        // should set status to "voided"
        onClick={() => navigate({ search: `?invoiceType=${InvoiceListStatusEnum.voided}` })}
      >
        <Typography variant="captionHl" color="grey600">
          {translate('text_6376641a2a9c70fff5bddcd5')}
        </Typography>
      </QuickFilter>
      <QuickFilter
        variant="tertiary"
        align="left"
        $isSelected={hasOnlyStatusFilter && selectedStatus === InvoiceListStatusEnum.disputed}
        // This should set paymentDisputeLost to true
        onClick={() => navigate({ search: `?invoiceType=${InvoiceListStatusEnum.disputed}` })}
      >
        <Typography variant="captionHl" color="grey600">
          {translate('text_66141e30699a0631f0b2ed32')}
        </Typography>
      </QuickFilter>
    </>
  )
}

const QuickFilter = styled(Button)<{ $isSelected: boolean }>`
  height: 44px;
  flex-shrink: 0;

  ${({ $isSelected }) =>
    $isSelected &&
    css`
      color: ${palette.primary.main};

      > div {
        color: ${palette.primary.main};
      }
    `};
`
