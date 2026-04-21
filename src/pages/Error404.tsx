// eslint-disable-next-line lago/no-direct-rrd-nav-import -- Error404 renders outside /:organizationSlug; the slug wrapper would be incorrect here.
import { useNavigate } from 'react-router-dom'

import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { HOME_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'

const Error404 = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()

  return (
    <div className="flex h-screen w-screen">
      <GenericPlaceholder
        image={<ErrorImage width="136" height="104" />}
        title={translate('text_62bac37900192b773560e82d')}
        subtitle={translate('text_62bac37900192b773560e82f')}
        buttonTitle={translate('text_62bac37900192b773560e831')}
        buttonAction={() => navigate(HOME_ROUTE, { replace: true })}
      />
    </div>
  )
}

export default Error404
