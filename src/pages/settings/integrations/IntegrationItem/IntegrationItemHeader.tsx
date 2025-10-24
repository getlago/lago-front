import { Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type IntegrationItemHeaderProps = {
  columnName: string
}

const IntegrationItemHeader = ({ columnName }: IntegrationItemHeaderProps) => {
  const { translate } = useInternationalization()

  return (
    <div className="flex h-10 w-full items-center justify-between px-12 shadow-b">
      <Typography variant="captionHl" color="grey600">
        {columnName}
      </Typography>
      <Typography variant="captionHl" color="grey600">
        {translate('text_6630e3210c13c500cd398e97')}
      </Typography>
    </div>
  )
}

export default IntegrationItemHeader
