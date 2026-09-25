import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { CONTRACTS_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ThinkingImage from '~/public/images/maneki/thinking.svg'

const ContractRateCardPhaseDetails = (): JSX.Element => {
  const { translate } = useInternationalization()

  return (
    <>
      <MainHeader.Configure
        breadcrumb={[
          { label: translate('text_17894894166553ysarr965xr'), path: CONTRACTS_ROUTE },
          { label: translate('text_17902866782060xpq8p9bh3a') },
          { label: translate('text_1790286678206xilydvk4a1n') },
        ]}
        entity={{ viewName: translate('text_1790286678206xilydvk4a1n') }}
      />
      <DetailsPage.Container className="pt-6">
        <GenericPlaceholder
          title={translate('text_1790286678206zy40b7ktge5')}
          subtitle={translate('text_17902866782061brel90bgxt')}
          image={<ThinkingImage />}
        />
      </DetailsPage.Container>
    </>
  )
}

export default ContractRateCardPhaseDetails
