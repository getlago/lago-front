import { MainHeader } from '~/components/MainHeader/MainHeader'
import { useInternationalization } from '~/hooks/core/useInternationalization'

const Plans = () => {
  const { translate } = useInternationalization()

  return (
    <>
      <MainHeader.Configure entity={{ viewName: translate('text_62442e40cea25600b0b6d85a') }} />
      <div className="p-4">{translate('text_62442e40cea25600b0b6d85a')}</div>
    </>
  )
}

export default Plans
