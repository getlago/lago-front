import { useParams } from 'react-router-dom'

import { Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import {
  SettingsListItemLoadingSkeleton,
  SettingsPaddedContainer,
  SettingsPageHeaderContainer,
} from '~/components/layouts/Settings'
import { BillingEntity, useGetBillingEntityQuery } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { BillingEntityTab } from '~/pages/settings/BillingEntity/BillingEntity'
import BillingEntityHeader from '~/pages/settings/BillingEntity/components/BillingEntityHeader'
import InformationBlock from '~/pages/settings/BillingEntity/sections/general/InformationBlock'
import TimezoneBlock from '~/pages/settings/BillingEntity/sections/general/TimezoneBlock'
import ErrorImage from '~/public/images/maneki/error.svg'

const BillingEntityGeneral = () => {
  const { translate } = useInternationalization()
  const { billingEntityCode } = useParams()

  const {
    data: billingEntityData,
    loading: billingEntityLoading,
    error: billingEntityError,
  } = useGetBillingEntityQuery({
    variables: {
      code: billingEntityCode as string,
    },
    skip: !billingEntityCode,
  })

  const billingEntity = billingEntityData?.billingEntity

  if (!!billingEntityError && !billingEntityLoading) {
    return (
      <GenericPlaceholder
        title={translate('text_62bb102b66ff57dbfe7905c0')}
        subtitle={translate('text_62bb102b66ff57dbfe7905c2')}
        buttonTitle={translate('text_62bb102b66ff57dbfe7905c4')}
        buttonVariant="primary"
        buttonAction={() => location.reload()}
        image={<ErrorImage width="136" height="104" />}
      />
    )
  }

  return (
    <>
      <BillingEntityHeader
        billingEntity={billingEntity as BillingEntity}
        tab={BillingEntityTab.GENERAL}
        loading={billingEntityLoading}
      />

      <SettingsPaddedContainer>
        <SettingsPageHeaderContainer>
          <Typography variant="headline">{translate('text_1742230191029o8hfgeebxl5')}</Typography>
          <Typography>{translate('text_6380d7e60f081e5b777c4b22')}</Typography>
        </SettingsPageHeaderContainer>

        {!!billingEntityLoading && <SettingsListItemLoadingSkeleton count={5} />}

        {!billingEntityLoading && billingEntity && (
          <>
            <TimezoneBlock billingEntity={billingEntity as BillingEntity} />

            <InformationBlock billingEntity={billingEntity as BillingEntity} />
          </>
        )}
      </SettingsPaddedContainer>
    </>
  )
}

export default BillingEntityGeneral
