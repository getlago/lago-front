import { gql } from '@apollo/client'
import { FormikProps } from 'formik'
import { memo, useRef } from 'react'

import { Button } from '~/components/designSystem/Button'
import { Chip } from '~/components/designSystem/Chip'
import { Selector, SelectorActions } from '~/components/designSystem/Selector'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { CenteredPage } from '~/components/layouts/CenteredPage'
import {
  SubscriptionFeeDrawer,
  SubscriptionFeeDrawerRef,
  SubscriptionFeeFormValues,
} from '~/components/plans/drawers/SubscriptionFeeDrawer'
import { usePlanFormContext } from '~/contexts/PlanFormContext'
import { FORM_TYPE_ENUM, getIntervalTranslationKey } from '~/core/constants/form'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { CurrencyEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { PlanFormInput } from './types'

gql`
  fragment PlanForSubscriptionFeeSection on Plan {
    id
    amountCents
    payInAdvance
    trialPeriod
    invoiceDisplayName
  }
`

interface SubscriptionFeeSectionProps {
  canBeEdited?: boolean
  isInSubscriptionForm?: boolean
  subscriptionFormType?: keyof typeof FORM_TYPE_ENUM
  formikProps: FormikProps<PlanFormInput>
  isEdition?: boolean
  onDrawerSave: (values: SubscriptionFeeFormValues) => void
}

export const SubscriptionFeeSection = memo(
  ({
    canBeEdited,
    isInSubscriptionForm,
    subscriptionFormType,
    onDrawerSave,
    formikProps,
    isEdition,
  }: SubscriptionFeeSectionProps) => {
    const { translate } = useInternationalization()
    const { interval, currency } = usePlanFormContext()
    const subscriptionFeeDrawerRef = useRef<SubscriptionFeeDrawerRef>(null)

    const openSubscriptionFeeDrawer = () => {
      subscriptionFeeDrawerRef.current?.openDrawer({
        amountCents: formikProps.values.amountCents || '',
        payInAdvance: formikProps.values.payInAdvance || false,
        trialPeriod: formikProps.values.trialPeriod ?? 0,
        invoiceDisplayName: formikProps.values.invoiceDisplayName || undefined,
      })
    }

    return (
      <CenteredPage.PageSection>
        <CenteredPage.PageSectionTitle
          title={translate('text_642d5eb2783a2ad10d670336')}
          description={translate('text_1770063200028xc3xmcvi7bw')}
        />

        <Selector
          icon="board"
          title={
            formikProps.values.invoiceDisplayName || translate('text_642d5eb2783a2ad10d670336')
          }
          subtitle={intlFormatNumber(Number(formikProps.values.amountCents), {
            style: 'currency',
            currency: currency || CurrencyEnum.Usd,
          })}
          endContent={
            <div className="flex items-center gap-3">
              <Chip label={translate(getIntervalTranslationKey[interval])} />
              <Tooltip placement="top-end" title={translate('text_17719630334671lxunwzo7ae')}>
                <Button icon="chevron-right-filled" variant="quaternary" tabIndex={-1} />
              </Tooltip>
            </div>
          }
          hoverActions={
            <SelectorActions
              actions={[
                {
                  icon: 'pen',
                  tooltipCopy: translate('text_63e51ef4985f0ebd75c212fc'),
                  onClick: () => openSubscriptionFeeDrawer(),
                },
              ]}
            />
          }
          data-test="open-subscription-fee-drawer"
          onClick={() => openSubscriptionFeeDrawer()}
        />

        <SubscriptionFeeDrawer
          ref={subscriptionFeeDrawerRef}
          canBeEdited={canBeEdited}
          isEdition={isEdition}
          isInSubscriptionForm={isInSubscriptionForm}
          onSave={onDrawerSave}
          subscriptionFormType={subscriptionFormType}
        />
      </CenteredPage.PageSection>
    )
  },
)

SubscriptionFeeSection.displayName = 'SubscriptionFeeSection'
