import { useParams } from 'react-router'

import { buildRateCardForRatePhaseFields } from '~/components/appliedRateCards/buildRateCardForRatePhaseFields'
import {
  formatRatePhaseName,
  getRateHistoryPath,
} from '~/components/appliedRateCards/ratePhaseDisplay'
import { AppliedRateCardContext } from '~/components/appliedRateCards/types'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { PageSectionTitle } from '~/components/layouts/Section'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { MainHeaderAction } from '~/components/MainHeader/types'
import { useMainHeaderTabContent } from '~/components/MainHeader/useMainHeaderTabContent'
import {
  AppliedRateCardDetailsTabsOptionsEnum,
  RatePhaseDetailsTabsOptionsEnum,
} from '~/core/constants/tabsOptions'
import { useNavigate } from '~/core/router'
import { RatePhaseForDrawerFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { usePermissions } from '~/hooks/usePermissions'

import { APPLIED_RATE_CARD_DETAILS_CONFIG } from './appliedRateCardDetailsConfig'
import { AppliedRateCardDetailsPlaceholder } from './AppliedRateCardDetailsPlaceholder'
import { RatePhaseDetailsOverview } from './RatePhaseDetailsOverview'
import { AppliedRateCardDetailsData } from './types'
import { useRatePhaseActions } from './useRatePhaseActions'

export const RATE_PHASE_DETAILS_ACTIONS_TEST_ID = 'rate-phase-details-actions'
export const RATE_PHASE_DETAILS_OVERVIEW_TAB_TEST_ID = 'rate-phase-details-overview-tab'
export const RATE_PHASE_DETAILS_ACTIVITY_LOGS_TAB_TEST_ID = 'rate-phase-details-activity-logs-tab'
export const RATE_PHASE_DETAILS_ACTIVITY_LOGS_EMPTY_TEST_ID =
  'rate-phase-details-activity-logs-empty'

type RatePhaseDetailsViewProps = {
  context: AppliedRateCardContext
  data: AppliedRateCardDetailsData | undefined
  phaseId: string
  loading: boolean
  hasError: boolean
  onPhaseDeleted?: () => void
}

type RatePhaseDetailsContentProps = {
  data: AppliedRateCardDetailsData
  phase: RatePhaseForDrawerFragment
  onPhaseDeleted?: () => void
}

const RatePhaseDetailsContent = ({
  data,
  phase,
  onPhaseDeleted,
}: RatePhaseDetailsContentProps): JSX.Element => {
  const navigate = useNavigate()
  const { organizationSlug } = useParams()
  const { translate } = useInternationalization()
  const { isPremium } = useCurrentUser()
  const { hasPermissions } = usePermissions()

  const { context, parent, appliedRateCard } = data
  const config = APPLIED_RATE_CARD_DETAILS_CONFIG[context]
  const cardPathParams = { parentId: parent.id, appliedRateCardId: appliedRateCard.id }
  const phasePathParams = { ...cardPathParams, phaseId: phase.id }
  const overviewLink = config.buildPhasePath({
    ...phasePathParams,
    tab: RatePhaseDetailsTabsOptionsEnum.overview,
  })
  const rateCard = buildRateCardForRatePhaseFields(
    appliedRateCard.product,
    appliedRateCard.rateCard,
  )
  const rateHistoryPath = getRateHistoryPath(appliedRateCard.rateCard.id, organizationSlug)

  const { getPhaseActions, getEditPhase } = useRatePhaseActions({
    context,
    appliedRateCardId: appliedRateCard.id,
    rateCard,
    phases: appliedRateCard.ratePhases,
    isLocked: parent.isLocked,
    onPhaseDeleted: () => {
      onPhaseDeleted?.()
      navigate(
        config.buildCardPath({
          ...cardPathParams,
          tab: AppliedRateCardDetailsTabsOptionsEnum.overview,
        }),
      )
    },
  })

  const actions: MainHeaderAction[] = [
    {
      type: 'dropdown',
      label: translate('text_626162c62f790600f850b6fe'),
      dataTest: RATE_PHASE_DETAILS_ACTIONS_TEST_ID,
      items: getPhaseActions(phase).map((action) => ({
        label: action.label,
        dataTest: action.dataTest,
        disabled: action.disabled,
        onClick: (closePopper) => {
          action.onAction()
          closePopper()
        },
      })),
    },
  ]

  const activeTabContent = useMainHeaderTabContent()

  return (
    <>
      <MainHeader.Configure
        snapshotKey={JSON.stringify({ data, phaseId: phase.id })}
        breadcrumb={[
          { label: translate(config.rootLabelKey), path: config.rootPath },
          { label: parent.name, path: config.buildParentRateCardsPath(parent.id) },
          { label: appliedRateCard.rateCard.code, path: config.buildCardPath(cardPathParams) },
          { label: translate('text_1790286678206xilydvk4a1n') },
        ]}
        entity={{
          viewName: formatRatePhaseName(phase, translate),
          metadata: translate('text_1792807216284omzlpv8edip', { position: phase.position }),
        }}
        actions={{ items: actions }}
        tabs={[
          {
            title: translate('text_628cf761cbe6820138b8f2e4'),
            link: overviewLink,
            match: [config.buildPhasePath(phasePathParams), overviewLink],
            dataTest: RATE_PHASE_DETAILS_OVERVIEW_TAB_TEST_ID,
            content: (
              <DetailsPage.Container className="pt-12">
                <RatePhaseDetailsOverview
                  phase={phase}
                  rateCard={rateCard}
                  rateHistoryPath={rateHistoryPath}
                  editPhase={getEditPhase(phase)}
                />
              </DetailsPage.Container>
            ),
          },
          {
            title: translate('text_1747314141347qq6rasuxisl'),
            link: config.buildPhasePath({
              ...phasePathParams,
              tab: RatePhaseDetailsTabsOptionsEnum.activityLogs,
            }),
            dataTest: RATE_PHASE_DETAILS_ACTIVITY_LOGS_TAB_TEST_ID,
            // `ResourceTypeEnum` has no rate phase member, so no log can be scoped to a phase yet.
            content: (
              <DetailsPage.Container className="pt-12">
                <section>
                  <PageSectionTitle
                    title={translate('text_1747314141347qq6rasuxisl')}
                    subtitle={translate('text_1792807216284fcthmczmbad')}
                    subtitleDataTest={RATE_PHASE_DETAILS_ACTIVITY_LOGS_EMPTY_TEST_ID}
                  />
                </section>
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

export const RatePhaseDetailsView = ({
  context,
  data,
  phaseId,
  loading,
  hasError,
  onPhaseDeleted,
}: RatePhaseDetailsViewProps): JSX.Element => {
  const phase = data?.appliedRateCard.ratePhases.find(({ id }) => id === phaseId)

  if (!data || !phase) {
    return (
      <AppliedRateCardDetailsPlaceholder
        context={context}
        loading={loading}
        hasError={hasError}
        lastCrumbLabelKey="text_1790286678206xilydvk4a1n"
      />
    )
  }

  return <RatePhaseDetailsContent data={data} phase={phase} onPhaseDeleted={onPhaseDeleted} />
}
