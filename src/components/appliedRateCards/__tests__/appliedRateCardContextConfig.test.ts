import { DocumentNode, OperationDefinitionNode } from 'graphql'

import {
  GetContractAppliedRateCardForDetailsDocument,
  GetContractAppliedRateCardSlicesForAppliedRateCardDrawerDocument,
  GetPlanAppliedRateCardForDetailsDocument,
  GetPlanAppliedRateCardSlicesForAppliedRateCardDrawerDocument,
} from '~/generated/graphql'

import {
  PRICED_SLICES_REFETCH_QUERIES,
  RATE_PHASE_REFETCH_QUERIES,
} from '../appliedRateCardContextConfig'

const getOperationName = (document: DocumentNode): string | undefined =>
  (document.definitions[0] as OperationDefinitionNode).name?.value

describe('RATE_PHASE_REFETCH_QUERIES', () => {
  it('GIVEN the plan context THEN it refetches the plan details operation', () => {
    expect(RATE_PHASE_REFETCH_QUERIES.plan).toEqual([
      getOperationName(GetPlanAppliedRateCardForDetailsDocument),
    ])
  })

  it('GIVEN the contract context THEN it refetches the contract details operation', () => {
    expect(RATE_PHASE_REFETCH_QUERIES.contract).toEqual([
      getOperationName(GetContractAppliedRateCardForDetailsDocument),
    ])
  })
})

describe('PRICED_SLICES_REFETCH_QUERIES', () => {
  it('GIVEN the plan context THEN it refetches the plan priced slices operation', () => {
    expect(PRICED_SLICES_REFETCH_QUERIES.plan).toEqual([
      getOperationName(GetPlanAppliedRateCardSlicesForAppliedRateCardDrawerDocument),
    ])
  })

  it('GIVEN the contract context THEN it refetches the contract priced slices operation', () => {
    expect(PRICED_SLICES_REFETCH_QUERIES.contract).toEqual([
      getOperationName(GetContractAppliedRateCardSlicesForAppliedRateCardDrawerDocument),
    ])
  })
})
