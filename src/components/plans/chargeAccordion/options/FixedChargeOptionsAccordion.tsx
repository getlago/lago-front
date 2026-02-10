import { gql } from '@apollo/client'

import { Chip } from '~/components/designSystem/Chip'
import { Typography } from '~/components/designSystem/Typography'
import {
  OptionsAccordion,
  OptionsAccordionProps,
} from '~/components/plans/chargeAccordion/options/OptionsAccordion'
import { LocalFixedChargeInput } from '~/components/plans/types'
import { useInternationalization } from '~/hooks/core/useInternationalization'

const CHIP_LABELS_MAPPING = {
  payInAdvance: {
    true: 'text_646e2d0bc536351b62ba6ebb',
    false: 'text_646e2d0cc536351b62ba6f0c',
  },
  prorated: {
    true: 'text_649c47c0a6c1f200de8ff48d',
    false: 'text_649c49bcebd91c0082d84446',
  },
}

gql`
  fragment ChargeForFixedChargeOptionsAccordion on FixedCharge {
    id
    payInAdvance
    prorated
  }
`

interface FixedChargeOptionsAccordionProps {
  charge: LocalFixedChargeInput
  children: OptionsAccordionProps['children']
}

export const FixedChargeOptionsAccordion = ({
  charge,
  children,
}: FixedChargeOptionsAccordionProps) => {
  const { translate } = useInternationalization()

  return (
    <OptionsAccordion
      summary={
        <div className="mr-3 flex flex-1 flex-col gap-1">
          <Typography variant="captionHl" color="grey700">
            {translate('text_646e2d0cc536351b62ba6f01')}
          </Typography>

          <div className="flex flex-wrap gap-2">
            <Chip label={translate(CHIP_LABELS_MAPPING.payInAdvance[`${!!charge.payInAdvance}`])} />
            <Chip label={translate(CHIP_LABELS_MAPPING.prorated[`${!!charge.prorated}`])} />
          </div>
        </div>
      }
    >
      {children}
    </OptionsAccordion>
  )
}
