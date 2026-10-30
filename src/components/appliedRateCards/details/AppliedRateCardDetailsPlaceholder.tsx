import { AppliedRateCardContext } from '~/components/appliedRateCards/types'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'

import { APPLIED_RATE_CARD_DETAILS_CONFIG } from './appliedRateCardDetailsConfig'

type AppliedRateCardDetailsPlaceholderProps = {
  context: AppliedRateCardContext
  loading: boolean
  hasError: boolean
  lastCrumbLabelKey: string
}

export const AppliedRateCardDetailsPlaceholder = ({
  context,
  loading,
  hasError,
  lastCrumbLabelKey,
}: AppliedRateCardDetailsPlaceholderProps): JSX.Element => {
  const { translate } = useInternationalization()
  const config = APPLIED_RATE_CARD_DETAILS_CONFIG[context]

  const renderBody = (): JSX.Element | null => {
    if (loading) {
      return (
        <DetailsPage.Container className="pt-12">
          <DetailsPage.Skeleton />
        </DetailsPage.Container>
      )
    }

    if (!hasError) return null

    return (
      <DetailsPage.Container className="pt-12">
        <GenericPlaceholder
          title={translate('text_629728388c4d2300e2d380d5')}
          subtitle={translate('text_629728388c4d2300e2d380eb')}
          buttonTitle={translate('text_629728388c4d2300e2d38110')}
          buttonVariant="primary"
          buttonAction={() => window.location.reload()}
          image={<ErrorImage width="136" height="104" />}
        />
      </DetailsPage.Container>
    )
  }

  return (
    <>
      <MainHeader.Configure
        breadcrumb={[
          { label: translate(config.rootLabelKey), path: config.rootPath },
          ...(loading ? [{ label: '', loading }] : []),
          { label: translate(lastCrumbLabelKey) },
        ]}
        entity={{ viewName: '', viewNameLoading: loading, metadataLoading: loading }}
        actions={{ items: [], loading }}
      />
      {renderBody()}
    </>
  )
}
