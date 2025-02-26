import { Typography } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type TIntegrationItemHeaderProps = {
  columnName: string
}

const IntegrationItemHeader = ({ columnName }: TIntegrationItemHeaderProps) => {
  const { translate } = useInternationalization()

  return (
    <div className="flex h-12 w-full items-center justify-between bg-grey-100 px-12 shadow-b">
      <Typography variant="bodyHl" color="grey500">
        {columnName}
      </Typography>
      <Typography variant="bodyHl" color="grey500">
        {translate('text_6630e3210c13c500cd398e97')}
      </Typography>
    </div>
  )
}

export default IntegrationItemHeader
