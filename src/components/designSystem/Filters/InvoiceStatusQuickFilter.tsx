import { useNavigate, useSearchParams } from 'react-router-dom'

import { Button, Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { tw } from '~/styles/utils'

import {
  buildDraftUrlParams,
  buildOutstandingUrlParams,
  buildPaymentDisputeLostUrlParams,
  buildPaymentOverdueUrlParams,
  buildSucceededUrlParams,
  buildVoidedUrlParams,
  isDraftUrlParams,
  isOutstandingUrlParams,
  isPaymentDisputeLostUrlParams,
  isPaymentOverdueUrlParams,
  isSucceededUrlParams,
  isVoidedUrlParams,
} from './utils'

const QuickFilter = ({
  children,
  isSelected,
  onClick,
}: {
  children: React.ReactNode
  isSelected: boolean
  onClick: () => void
}) => (
  <Button
    className={tw({
      'text-blue-600 [&>div]:text-blue-600': isSelected,
    })}
    variant="tertiary"
    align="left"
    onClick={onClick}
  >
    {children}
  </Button>
)

export const InvoiceStatusQuickFilter = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  let [searchParams] = useSearchParams()

  return (
    <>
      <QuickFilter isSelected={searchParams.size === 0} onClick={() => navigate({ search: '' })}>
        <Typography variant="captionHl" color="grey600">
          {translate('text_63ac86d797f728a87b2f9f8b')}
        </Typography>
      </QuickFilter>
      <QuickFilter
        isSelected={isDraftUrlParams(searchParams)}
        onClick={() => navigate({ search: buildDraftUrlParams() })}
      >
        <Typography variant="captionHl" color="grey600">
          {translate('text_63ac86d797f728a87b2f9f91')}
        </Typography>
      </QuickFilter>
      <QuickFilter
        isSelected={isOutstandingUrlParams(searchParams)}
        onClick={() => navigate({ search: buildOutstandingUrlParams() })}
      >
        <Typography variant="captionHl" color="grey600">
          {translate('text_666c5b12fea4aa1e1b26bf52')}
        </Typography>
      </QuickFilter>
      <QuickFilter
        isSelected={isPaymentOverdueUrlParams(searchParams)}
        onClick={() => navigate({ search: buildPaymentOverdueUrlParams() })}
      >
        <Typography variant="captionHl" color="grey600">
          {translate('text_666c5b12fea4aa1e1b26bf55')}
        </Typography>
      </QuickFilter>
      <QuickFilter
        isSelected={isSucceededUrlParams(searchParams)}
        onClick={() => navigate({ search: buildSucceededUrlParams() })}
      >
        <Typography variant="captionHl" color="grey600">
          {translate('text_63ac86d797f728a87b2f9fa1')}
        </Typography>
      </QuickFilter>
      <QuickFilter
        isSelected={isVoidedUrlParams(searchParams)}
        onClick={() => navigate({ search: buildVoidedUrlParams() })}
      >
        <Typography variant="captionHl" color="grey600">
          {translate('text_6376641a2a9c70fff5bddcd5')}
        </Typography>
      </QuickFilter>
      <QuickFilter
        isSelected={isPaymentDisputeLostUrlParams(searchParams)}
        onClick={() => navigate({ search: buildPaymentDisputeLostUrlParams() })}
      >
        <Typography variant="captionHl" color="grey600">
          {translate('text_66141e30699a0631f0b2ed32')}
        </Typography>
      </QuickFilter>
    </>
  )
}
