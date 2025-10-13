import { gql } from '@apollo/client'
import { AccordionDetails, AccordionSummary, Accordion as MuiAccordion } from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import { ReactNode, useState } from 'react'

import { Button, Chip, Tooltip, Typography } from '~/components/designSystem'
import { LocalChargeInput } from '~/components/plans/types'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum, RegroupPaidFeesEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { NAV_HEIGHT, theme } from '~/styles'

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
  chargePricingUnitShortName: string | undefined
  children: ReactNode | ((args: { isOpen: boolean }) => ReactNode)
  currency: CurrencyEnum
  initiallyOpen?: boolean
  transitionProps?: TransitionProps
}

export const ChargeOptionsAccordion = ({
  id,
  charge,
  chargePricingUnitShortName,
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
    <div id={id} className="rounded-b-xl border-t border-grey-400">
      <MuiAccordion
        expanded={isOpen}
        onChange={(_, expanded) => setIsOpen(expanded)}
        TransitionProps={{ unmountOnExit: true, ...transitionProps }}
        square
      >
        <AccordionSummary
          className="min-h-18 rounded-b-xl"
          sx={{
            '&.Mui-expanded': {
              borderRadius: 0,
            },
            '&.MuiAccordionSummary-root.Mui-focusVisible': {
              backgroundColor: 'inherit',
              boxShadow: `0px 0px 0px 4px ${theme.palette.primary[200]}`,
            },
            '&:hover': {
              backgroundColor: theme.palette.grey[100],
            },
            '&:active': {
              backgroundColor: theme.palette.grey[200],
            },
            '.MuiAccordionSummary-content': {
              minHeight: `${NAV_HEIGHT}px`,
              padding: `${theme.spacing(3)} ${theme.spacing(4)}`,
            },
          }}
        >
          <div className="mr-3 flex flex-1 flex-col gap-1">
            <Typography variant="captionHl" color="grey700">
              {translate('text_646e2d0cc536351b62ba6f01')}
            </Typography>
            <div className="flex flex-wrap gap-2">
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
                          pricingUnitShortName: chargePricingUnitShortName,
                          currencyDisplay: 'symbol',
                          currency,
                          maximumFractionDigits: 15,
                        }),
                      })
                    : translate('text_646e2d0cc536351b62ba6f20')
                }
              />
            </div>
          </div>
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
        </AccordionSummary>
        <AccordionDetails className="flex flex-col gap-6 p-4 shadow-t">
          {typeof children === 'function' ? children({ isOpen }) : children}
        </AccordionDetails>
      </MuiAccordion>
    </div>
  )
}
