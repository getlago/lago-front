import { gql } from '@apollo/client'
import { AccordionDetails, AccordionSummary, Accordion as MuiAccordion } from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import { ReactNode, useState } from 'react'
import styled from 'styled-components'

import { Button, Chip, Tooltip, Typography } from '~/components/designSystem'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, RegroupPaidFeesEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { NAV_HEIGHT, theme } from '~/styles'

import { LocalChargeInput } from './types'

gql`
  fragment ChargeForChargeOptionsAccordion on Charge {
    id
    invoiceable
    minAmountCents
    payInAdvance
    regroupPaidFees
  }
`

interface ChargeOptionsAccordionProps {
  id?: string
  charge: LocalChargeInput
  children: ReactNode | ((args: { isOpen: boolean }) => ReactNode)
  currency: CurrencyEnum
  initiallyOpen?: boolean
  transitionProps?: TransitionProps
}

export const ChargeOptionsAccordion = ({
  id,
  charge,
  children,
  currency,
  initiallyOpen = false,
  transitionProps = {},
}: ChargeOptionsAccordionProps) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen)
  const { translate } = useInternationalization()

  const getInvoiceableChargeLabel = (localCharge: LocalChargeInput) => {
    if (localCharge.payInAdvance) {
      if (localCharge.regroupPaidFees === RegroupPaidFeesEnum.Invoice) {
        return translate('text_6682c52081acea9052074502')
      }

      if (localCharge.invoiceable) {
        return translate('text_6682c52081acea90520744bc')
      }

      return translate('text_6682c52081acea9052074686')
    }

    return translate('text_6682c52081acea9052074502')
  }

  return (
    <Container id={id}>
      <StyledChargeOptionsAccordion
        expanded={isOpen}
        onChange={(_, expanded) => setIsOpen(expanded)}
        TransitionProps={{ unmountOnExit: true, ...transitionProps }}
        square
      >
        <SummaryWrapper>
          <Summary>
            <Typography variant="captionHl" color="grey700">
              {translate('text_646e2d0cc536351b62ba6f01')}
            </Typography>
            <ChipsWrapper>
              <Chip
                label={
                  charge.payInAdvance
                    ? translate('text_646e2d0bc536351b62ba6ebb')
                    : translate('text_646e2d0cc536351b62ba6f0c')
                }
              />
              <Chip label={getInvoiceableChargeLabel(charge)} />
              <Chip
                label={
                  charge.prorated
                    ? translate('text_649c47c0a6c1f200de8ff48d')
                    : translate('text_649c49bcebd91c0082d84446')
                }
              />

              <Chip
                label={
                  !!Number(charge.minAmountCents)
                    ? translate('text_646e2d0cc536351b62ba6fcf', {
                        minAmountCents: intlFormatNumber(charge.minAmountCents, {
                          currencyDisplay: 'symbol',
                          currency,
                          maximumFractionDigits: 15,
                        }),
                      })
                    : translate('text_646e2d0cc536351b62ba6f20')
                }
              />
            </ChipsWrapper>
          </Summary>
          <Tooltip
            placement="top-start"
            title={translate(
              isOpen ? 'text_624aa732d6af4e0103d40e61' : 'text_624aa79870f60300a3c4d074',
            )}
          >
            <Button
              tabIndex={-1}
              data-test="open-charge"
              variant="quaternary"
              size="small"
              icon={isOpen ? 'chevron-down' : 'chevron-right'}
            />
          </Tooltip>
        </SummaryWrapper>
        <Details>{typeof children === 'function' ? children({ isOpen }) : children}</Details>
      </StyledChargeOptionsAccordion>
    </Container>
  )
}

const Container = styled.div`
  border-top: 1px solid ${theme.palette.grey[400]};
  border-radius: 0 0 12px 12px;
`

const StyledChargeOptionsAccordion = styled(MuiAccordion)`
  border-radius: 0 0 12px 12px;
  overflow: hidden;

  &.MuiAccordion-root.MuiPaper-root {
    border-radius: 0 0 12px 12px;
    background-color: transparent;
  }
  &.MuiAccordion-root {
    overflow: inherit;

    &:before {
      height: 0;
    }
    &.Mui-expanded {
      margin: 0;
    }
  }

  .MuiAccordionSummary-content {
    width: 100%;
  }
`

const SummaryWrapper = styled(AccordionSummary)`
  && {
    min-height: ${NAV_HEIGHT}px;
    border-radius: 0 0 12px 12px;
    transition: border-radius 0.025s ease-in-out;

    &.Mui-expanded {
      border-radius: 0;
    }

    &.MuiAccordionSummary-root.Mui-focusVisible {
      background-color: inherit;
      box-shadow: 0px 0px 0px 4px ${theme.palette.primary[200]};
      &:hover {
        background-color: ${theme.palette.grey[100]};
      }
    }

    &:hover {
      background-color: ${theme.palette.grey[100]};
    }

    &:active {
      background-color: ${theme.palette.grey[200]};
    }

    .MuiAccordionSummary-content {
      display: flex;
      min-height: ${NAV_HEIGHT}px;
      box-sizing: border-box;
      align-items: center;
      padding: ${theme.spacing(3)} ${theme.spacing(4)};
    }
  }
`

const Summary = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: ${theme.spacing(1)};
  margin-right: ${theme.spacing(3)};
`

const ChipsWrapper = styled.div`
  display: flex;
  gap: ${theme.spacing(2)};
  flex-wrap: wrap;
`

const Details = styled(AccordionDetails)`
  display: flex;
  flex-direction: column;
  box-shadow: ${theme.shadows[5]};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(6)};
  }

  &.MuiAccordionDetails-root {
    padding: ${theme.spacing(4)};
  }
`
