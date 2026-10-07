import { Typography } from '~/components/designSystem/Typography'
import { useInternationalization } from '~/hooks/core/useInternationalization'

type RealtimeUsageEmptyProps = {
  testId: string
  hasError: boolean
}

export const RealtimeUsageEmpty = ({ testId, hasError }: RealtimeUsageEmptyProps): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <div className="flex flex-col gap-1 py-8 text-center" data-test={testId}>
      <Typography variant="subhead2" color="grey700">
        {translate(hasError ? 'text_62d7ffcb1c57d7e6d15bdce3' : 'text_1787607502687zw3kwy13xlm')}
      </Typography>
      <Typography variant="caption" color="grey600">
        {translate(hasError ? 'text_62d7ffcb1c57d7e6d15bdce5' : 'text_17876075026878y6buigdffk')}
      </Typography>
    </div>
  )
}
