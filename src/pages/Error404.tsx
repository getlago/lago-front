import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { HOME_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useLocationHistory } from '~/hooks/core/useLocationHistory'
import ErrorImage from '~/public/images/maneki/error.svg'

const Error404 = () => {
  const { translate } = useInternationalization()
  const { goBack } = useLocationHistory()

  return (
    <div className="flex h-screen w-screen">
      <GenericPlaceholder
        image={<ErrorImage width="136" height="104" />}
        title={translate('text_62bac37900192b773560e82d')}
        subtitle={translate('text_62bac37900192b773560e82f')}
        buttonTitle={translate('text_62bac37900192b773560e831')}
        buttonAction={() => goBack(HOME_ROUTE, { previousCount: -2 })}
      />
    </div>
  )
}

export default Error404
