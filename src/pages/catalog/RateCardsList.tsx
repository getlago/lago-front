import { useInternationalization } from '~/hooks/core/useInternationalization'

export const RATE_CARDS_LIST_TEST_ID = 'rate-cards-list'

const RateCardsList = () => {
  const { translate } = useInternationalization()

  return (
    <div className="p-4" data-test={RATE_CARDS_LIST_TEST_ID}>
      {translate('text_1783104239825nxqno33u945')}
    </div>
  )
}

export default RateCardsList
