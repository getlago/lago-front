import { useInternationalization } from '~/hooks/core/useInternationalization'

const RateCardsList = () => {
  const { translate } = useInternationalization()

  return <div className="p-4">{translate('text_1783104239825nxqno33u945')}</div>
}

export default RateCardsList
