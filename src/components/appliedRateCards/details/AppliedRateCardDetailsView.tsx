import { buildRateCardForRatePhaseFields } from '~/components/appliedRateCards/buildRateCardForRatePhaseFields'
import { AppliedRateCardContext } from '~/components/appliedRateCards/types'
import { useAppliedRateCardRowActions } from '~/components/appliedRateCards/useAppliedRateCardRowActions'
import { GenericPlaceholder } from '~/components/designSystem/GenericPlaceholder'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { MainHeaderAction } from '~/components/MainHeader/types'
import { useMainHeaderTabContent } from '~/components/MainHeader/useMainHeaderTabContent'
import { AppliedRateCardDetailsTabsOptionsEnum } from '~/core/constants/tabsOptions'
import { useNavigate } from '~/core/router'
import { RatePhaseForDrawerFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'
import ErrorImage from '~/public/images/maneki/error.svg'

import { AppliedRateCardActivityLogs } from './AppliedRateCardActivityLogs'
import { APPLIED_RATE_CARD_DETAILS_CONFIG } from './appliedRateCardDetailsConfig'
import { AppliedRateCardDetailsOverview } from './AppliedRateCardDetailsOverview'
import { AppliedRateCardDetailsData } from './types'
import { useRatePhaseActions } from './useRatePhaseActions'

export const APPLIED_RATE_CARD_DETAILS_ACTIONS_TEST_ID = 'applied-rate-card-details-actions'
export const APPLIED_RATE_CARD_DETAILS_CREATE_PHASE_TEST_ID =
  'applied-rate-card-details-create-phase'
export const APPLIED_RATE_CARD_DETAILS_REMOVE_TEST_ID = 'applied-rate-card-details-remove'
export const APPLIED_RATE_CARD_DETAILS_OVERVIEW_TAB_TEST_ID =
  'applied-rate-card-details-overview-tab'
export const APPLIED_RATE_CARD_DETAILS_ACTIVITY_LOGS_TAB_TEST_ID =
  'applied-rate-card-details-activity-logs-tab'

type AppliedRateCardDetailsPlaceholderProps = {
  context: AppliedRateCardContext
  loading: boolean
  hasError: boolean
}

type AppliedRateCardDetailsViewProps = AppliedRateCardDetailsPlaceholderProps & {
  data: AppliedRateCardDetailsData | undefined
}

const AppliedRateCardDetailsPlaceholder = ({
  context,
  loading,
  hasError,
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
          { label: translate('text_17902866782060xpq8p9bh3a') },
        ]}
        entity={{ viewName: '', viewNameLoading: loading, metadataLoading: loading }}
        actions={{ items: [], loading }}
      />
      {renderBody()}
    </>
  )
}

const AppliedRateCardDetailsContent = ({
  data,
}: {
  data: AppliedRateCardDetailsData
}): JSX.Element => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()

  const { context, parent, appliedRateCard } = data
  const config = APPLIED_RATE_CARD_DETAILS_CONFIG[context]
  const parentRateCardsPath = config.buildParentRateCardsPath(parent.id)
  const cardPathParams = { parentId: parent.id, appliedRateCardId: appliedRateCard.id }
  const overviewLink = config.buildCardPath({
    ...cardPathParams,
    tab: AppliedRateCardDetailsTabsOptionsEnum.overview,
  })
  const rateCard = buildRateCardForRatePhaseFields(
    appliedRateCard.product,
    appliedRateCard.rateCard,
  )

  const { getPhaseActions, createPhase } = useRatePhaseActions({
    context,
    appliedRateCardId: appliedRateCard.id,
    rateCard,
    phases: appliedRateCard.ratePhases,
    isLocked: parent.isLocked,
  })

  const { removal, removeRateCard } = useAppliedRateCardRowActions({
    context,
    parentId: parent.id,
    isRemovalLocked: parent.isLocked,
    onRemoved: () => navigate(parentRateCardsPath),
  })

  const getPhaseHref = (phase: RatePhaseForDrawerFragment): string =>
    config.buildPhasePath({ ...cardPathParams, phaseId: phase.id })

  const actions: MainHeaderAction[] = [
    {
      type: 'dropdown',
      label: translate('text_626162c62f790600f850b6fe'),
      dataTest: APPLIED_RATE_CARD_DETAILS_ACTIONS_TEST_ID,
      items: [
        {
          label: translate('text_1792507128247xgs5eskh1bu'),
          dataTest: APPLIED_RATE_CARD_DETAILS_CREATE_PHASE_TEST_ID,
          hidden: createPhase.hidden,
          disabled: createPhase.disabled,
          onClick: (closePopper) => {
            createPhase.open()
            closePopper()
          },
        },
        {
          label: translate('text_1790284386156k2d8mjjy98f'),
          dataTest: APPLIED_RATE_CARD_DETAILS_REMOVE_TEST_ID,
          hidden: removal.status === 'hidden',
          disabled: removal.status === 'disabled',
          onClick: (closePopper) => {
            removeRateCard(appliedRateCard)
            closePopper()
          },
        },
      ],
    },
  ]

  const activeTabContent = useMainHeaderTabContent()

  return (
    <>
      <MainHeader.Configure
        // The header re-pushes its tab content and action closures only when this key changes.
        snapshotKey={JSON.stringify(data)}
        breadcrumb={[
          { label: translate(config.rootLabelKey), path: config.rootPath },
          { label: parent.name, path: parentRateCardsPath },
          { label: translate('text_17902866782060xpq8p9bh3a') },
        ]}
        entity={{
          viewName: appliedRateCard.rateCard.name,
          metadata: appliedRateCard.rateCard.code,
        }}
        actions={{ items: actions }}
        tabs={[
          {
            title: translate('text_628cf761cbe6820138b8f2e4'),
            link: overviewLink,
            match: [config.buildCardPath(cardPathParams), overviewLink],
            dataTest: APPLIED_RATE_CARD_DETAILS_OVERVIEW_TAB_TEST_ID,
            content: (
              <DetailsPage.Container className="pt-12">
                <AppliedRateCardDetailsOverview
                  data={data}
                  rateCard={rateCard}
                  createPhase={createPhase}
                  getPhaseActions={getPhaseActions}
                  getPhaseHref={getPhaseHref}
                />
              </DetailsPage.Container>
            ),
          },
          {
            title: translate('text_1747314141347qq6rasuxisl'),
            link: config.buildCardPath({
              ...cardPathParams,
              tab: AppliedRateCardDetailsTabsOptionsEnum.activityLogs,
            }),
            dataTest: APPLIED_RATE_CARD_DETAILS_ACTIVITY_LOGS_TAB_TEST_ID,
            content: (
              <DetailsPage.Container className="flex-1 pb-0 pt-12">
                <AppliedRateCardActivityLogs
                  context={context}
                  appliedRateCardId={appliedRateCard.id}
                />
              </DetailsPage.Container>
            ),
            hidden: !isPremium || !hasPermissions(['auditLogsView']),
          },
        ]}
      />

      {activeTabContent}
    </>
  )
}

export const AppliedRateCardDetailsView = ({
  context,
  data,
  loading,
  hasError,
}: AppliedRateCardDetailsViewProps): JSX.Element => {
  if (!data) {
    return (
      <AppliedRateCardDetailsPlaceholder context={context} loading={loading} hasError={hasError} />
    )
  }

  return <AppliedRateCardDetailsContent data={data} />
}
