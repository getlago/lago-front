import { generatePath } from 'react-router'

import { AppliedRateCardContext } from '~/components/appliedRateCards/types'
import {
  AppliedRateCardDetailsTabsOptionsEnum,
  CatalogPlanOverviewSectionsEnum,
  ContractOverviewSectionsEnum,
} from '~/core/constants/tabsOptions'
import {
  CATALOG_PLAN_DETAILS_SECTION_ROUTE,
  CATALOG_PLAN_RATE_CARD_DETAILS_ROUTE,
  CATALOG_PLAN_RATE_CARD_DETAILS_TAB_ROUTE,
  CATALOG_PLAN_RATE_CARD_PHASE_DETAILS_ROUTE,
  CONTRACT_DETAILS_SECTION_ROUTE,
  CONTRACT_RATE_CARD_DETAILS_ROUTE,
  CONTRACT_RATE_CARD_DETAILS_TAB_ROUTE,
  CONTRACT_RATE_CARD_PHASE_DETAILS_ROUTE,
  CONTRACTS_ROUTE,
  PLAN_PRICING_ROUTE,
} from '~/core/router'
import { ResourceTypeEnum } from '~/generated/graphql'

type AppliedRateCardPathParams = {
  parentId: string
  appliedRateCardId: string
  tab?: AppliedRateCardDetailsTabsOptionsEnum
}

type RatePhasePathParams = {
  parentId: string
  appliedRateCardId: string
  phaseId: string
}

type AppliedRateCardDetailsConfig = {
  rootLabelKey: string
  rootPath: string
  activityLogResourceType: ResourceTypeEnum
  buildParentRateCardsPath: (parentId: string) => string
  buildCardPath: (params: AppliedRateCardPathParams) => string
  buildPhasePath: (params: RatePhasePathParams) => string
}

export const APPLIED_RATE_CARD_NOT_FOUND_TRANSLATION_KEY = 'text_1792507128247tj6ezglktl8'

export const APPLIED_RATE_CARD_DETAILS_CONFIG: Record<
  AppliedRateCardContext,
  AppliedRateCardDetailsConfig
> = {
  plan: {
    rootLabelKey: 'text_62442e40cea25600b0b6d85a',
    rootPath: PLAN_PRICING_ROUTE,
    activityLogResourceType: ResourceTypeEnum.PlanRateCard,
    buildParentRateCardsPath: (parentId) =>
      generatePath(CATALOG_PLAN_DETAILS_SECTION_ROUTE, {
        catalogPlanId: parentId,
        section: CatalogPlanOverviewSectionsEnum.rateCards,
      }),
    buildCardPath: ({ parentId, appliedRateCardId, tab }) => {
      if (!tab) {
        return generatePath(CATALOG_PLAN_RATE_CARD_DETAILS_ROUTE, {
          catalogPlanId: parentId,
          appliedRateCardId,
        })
      }

      return generatePath(CATALOG_PLAN_RATE_CARD_DETAILS_TAB_ROUTE, {
        catalogPlanId: parentId,
        appliedRateCardId,
        tab,
      })
    },
    buildPhasePath: ({ parentId, appliedRateCardId, phaseId }) =>
      generatePath(CATALOG_PLAN_RATE_CARD_PHASE_DETAILS_ROUTE, {
        catalogPlanId: parentId,
        appliedRateCardId,
        phaseId,
      }),
  },
  contract: {
    rootLabelKey: 'text_17894894166553ysarr965xr',
    rootPath: CONTRACTS_ROUTE,
    activityLogResourceType: ResourceTypeEnum.ContractRateCard,
    buildParentRateCardsPath: (parentId) =>
      generatePath(CONTRACT_DETAILS_SECTION_ROUTE, {
        id: parentId,
        section: ContractOverviewSectionsEnum.rateCards,
      }),
    buildCardPath: ({ parentId, appliedRateCardId, tab }) => {
      if (!tab) {
        return generatePath(CONTRACT_RATE_CARD_DETAILS_ROUTE, { id: parentId, appliedRateCardId })
      }

      return generatePath(CONTRACT_RATE_CARD_DETAILS_TAB_ROUTE, {
        id: parentId,
        appliedRateCardId,
        tab,
      })
    },
    buildPhasePath: ({ parentId, appliedRateCardId, phaseId }) =>
      generatePath(CONTRACT_RATE_CARD_PHASE_DETAILS_ROUTE, {
        id: parentId,
        appliedRateCardId,
        phaseId,
      }),
  },
}
