import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'

import { REALTIME_USAGE_ERROR_TEST_ID } from './constants'

export const RealtimeUsageError = (): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <div data-test={REALTIME_USAGE_ERROR_TEST_ID}>
      <GenericPlaceholder
        title={translate('text_634812d6f16b31ce5cbf4126')}
        subtitle={translate('text_634812d6f16b31ce5cbf4128')}
        buttonTitle={translate('text_634812d6f16b31ce5cbf412a')}
        buttonVariant="primary"
        buttonAction={() => location.reload()}
        image={<ErrorImage width="136" height="104" />}
      />
    </div>
  )
}
