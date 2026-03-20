import { FormikProps } from 'formik'
import { useMemo, useRef } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { Selector, SelectorActions } from '~/components/designSystem/Selector'
import { Typography } from '~/components/designSystem/Typography'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import {
  MinimumCommitmentDrawer,
  MinimumCommitmentDrawerRef,
  MinimumCommitmentFormValues,
} from '~/components/plans/drawers/MinimumCommitmentDrawer'
import {
  mapChargeIntervalCopy,
  returnFirstDefinedArrayRatesSumAsString,
} from '~/components/plans/utils'
import PremiumFeature from '~/components/premium/PremiumFeature'
import { getIntervalTranslationKey } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'

import { PlanFormInput } from './types'

export const OPEN_MINIMUM_COMMITMENT_DRAWER_TEST_ID = 'open-minimum-commitment-drawer'
export const ADD_MINIMUM_COMMITMENT_TEST_ID = 'add-minimum-commitment'

type CommitmentsSectionProps = {
  formikProps: FormikProps<PlanFormInput>
  onDrawerSave: (values: MinimumCommitmentFormValues) => void
}

export const CommitmentsSection = ({ formikProps, onDrawerSave }: CommitmentsSectionProps) => {
  const { isPremium } = useCurrentUser()
  const { translate } = useInternationalization()
  const minimumCommitmentDrawerRef = useRef<MinimumCommitmentDrawerRef>(null)

  const commitment = formikProps.values.minimumCommitment
  const hasCommitment = !isNaN(Number(commitment?.amountCents)) && !!commitment?.amountCents

  const taxValueForBadgeDisplay = useMemo((): string | undefined => {
    return returnFirstDefinedArrayRatesSumAsString(commitment?.taxes || [])
  }, [commitment?.taxes])

  const currency = formikProps.values.amountCurrency || CurrencyEnum.Usd
  const interval = formikProps.values.interval

  const openMinimumCommitmentDrawer = () => {
    minimumCommitmentDrawerRef.current?.openDrawer({
      amountCents: commitment?.amountCents || '',
      invoiceDisplayName: commitment?.invoiceDisplayName || undefined,
      taxes: commitment?.taxes || [],
    })
  }

  return (
    <CenteredPage.PageSection>
      <CenteredPage.PageSectionTitle
        title={translate('text_65d601bffb11e0f9d1d9f569')}
        description={
          <Typography variant="caption" color="grey600">
            {translate('text_6661fc17337de3591e29e451', {
              interval: translate(mapChargeIntervalCopy(interval, false)).toLocaleLowerCase(),
            })}
          </Typography>
        }
      />

      {hasCommitment && (
        <Selector
          icon="minus-circle"
          title={commitment?.invoiceDisplayName || translate('text_65d601bffb11e0f9d1d9f569')}
          subtitle={intlFormatNumber(Number(commitment?.amountCents), {
            style: 'currency',
            currency,
          })}
          endContent={
            <div className="flex items-center gap-3">
              {!!taxValueForBadgeDisplay && (
                <Chip
                  label={intlFormatNumber(Number(taxValueForBadgeDisplay) / 100 || 0, {
                    style: 'percent',
                  })}
                />
              )}
              <Chip label={translate(getIntervalTranslationKey[interval])} />
              <Button icon="chevron-right-filled" variant="quaternary" tabIndex={-1} />
            </div>
          }
          hoverActions={
            <SelectorActions
              actions={[
                {
                  icon: 'trash',
                  tooltipCopy: translate('text_63aa085d28b8510cd46443ff'),
                  onClick: () => {
                    formikProps.setFieldValue('minimumCommitment', {})
                  },
                },
                {
                  icon: 'pen',
                  tooltipCopy: translate('text_63e51ef4985f0ebd75c212fc'),
                  onClick: () => openMinimumCommitmentDrawer(),
                },
              ]}
            />
          }
          data-test={OPEN_MINIMUM_COMMITMENT_DRAWER_TEST_ID}
          onClick={() => openMinimumCommitmentDrawer()}
        />
      )}

      {!hasCommitment && !isPremium && (
        <PremiumFeature
          title={translate('text_17700400130439xuo82ha60n')}
          description={translate('text_1770040013043awgs0eemonf')}
          feature={translate('text_65d601bffb11e0f9d1d9f569')}
        />
      )}

      {!hasCommitment && isPremium && (
        <Button
          fitContent
          variant="inline"
          startIcon="plus"
          data-test={ADD_MINIMUM_COMMITMENT_TEST_ID}
          onClick={() => {
            minimumCommitmentDrawerRef.current?.openDrawer({
              amountCents: '',
              invoiceDisplayName: undefined,
              taxes: [],
            })
          }}
        >
          {translate('text_6661ffe746c680007e2df0e1')}
        </Button>
      )}

      <MinimumCommitmentDrawer ref={minimumCommitmentDrawerRef} onSave={onDrawerSave} />
    </CenteredPage.PageSection>
  )
}

CommitmentsSection.displayName = 'CommitmentsSection'
