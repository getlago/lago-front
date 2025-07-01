import { RevenueStreamsCustomerBreakdownSection } from '~/components/analytics/revenueStreams/RevenueStreamsCustomerBreakdownSection'
import { RevenueStreamsPlanBreakdownSection } from '~/components/analytics/revenueStreams/RevenueStreamsPlanBreakdownSection'
import { NavigationTab, TabManagedBy, Typography } from '~/components/designSystem'
import { PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type RevenueStreamsBreakdownSectionProps = {
  premiumWarningDialogRef: React.RefObject<PremiumWarningDialogRef>
}

export const RevenueStreamsBreakdownSection = ({
  premiumWarningDialogRef,
}: RevenueStreamsBreakdownSectionProps) => {
  const { translate } = useInternationalization()

  return (
    <section className="flex flex-col">
      <div className="mb-6 flex flex-col gap-2">
        <Typography variant="subhead1" color="grey700">
          {translate('text_1739206045861dgu7ype5jyx')}
        </Typography>
        <Typography variant="caption" color="grey600">
          {translate('text_17392060910488ax2d18o9u9')}
        </Typography>
      </div>

      <NavigationTab
        managedBy={TabManagedBy.INDEX}
        tabs={[
          {
            title: translate('text_62442e40cea25600b0b6d85a'),
            component: (
              <RevenueStreamsPlanBreakdownSection
                premiumWarningDialogRef={premiumWarningDialogRef}
              />
            ),
          },
          {
            title: translate('text_624efab67eb2570101d117a5'),
            component: (
              <RevenueStreamsCustomerBreakdownSection
                premiumWarningDialogRef={premiumWarningDialogRef}
              />
            ),
          },
        ]}
      />
    </section>
  )
}
