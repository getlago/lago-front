import { Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'

const RevenueStreamsBreakdownSection = () => {
  const { translate } = useInternationalization()

  return (
    <section>
      <Typography className="mb-2" variant="subhead" color="grey700">
        {translate('text_1739206045861dgu7ype5jyx')}
      </Typography>
      <Typography variant="caption" color="grey600">
        {translate('text_17392060910488ax2d18o9u9')}
      </Typography>
    </section>
  )
}

export default RevenueStreamsBreakdownSection
