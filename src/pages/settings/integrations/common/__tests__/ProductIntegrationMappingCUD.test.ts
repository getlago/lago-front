import { renderHook } from '@testing-library/react'

import { MappableTypeEnum } from '~/generated/graphql'
import { useAnrokIntegrationMappingCUD } from '~/pages/settings/integrations/AnrokIntegrationMapItemDrawer/useAnrokIntegrationMappingCUD'
import { useAvalaraIntegrationMappingCUD } from '~/pages/settings/integrations/AvalaraIntegrationMapItemDrawer/useAvalaraIntegrationMappingCUD'

const mockCreateAnrokMapping = jest.fn<jest.Mock[], [unknown]>(() => [jest.fn()])
const mockUpdateAnrokMapping = jest.fn<jest.Mock[], [unknown]>(() => [jest.fn()])
const mockDeleteAnrokMapping = jest.fn<jest.Mock[], [unknown]>(() => [jest.fn()])
const mockCreateAvalaraMapping = jest.fn<jest.Mock[], [unknown]>(() => [jest.fn()])
const mockUpdateAvalaraMapping = jest.fn<jest.Mock[], [unknown]>(() => [jest.fn()])
const mockDeleteAvalaraMapping = jest.fn<jest.Mock[], [unknown]>(() => [jest.fn()])

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useCreateAnrokIntegrationCollectionMappingMutation: () => [jest.fn()],
  useCreateAnrokIntegrationMappingMutation: (options: unknown) => mockCreateAnrokMapping(options),
  useDeleteAnrokIntegrationCollectionMappingMutation: () => [jest.fn()],
  useDeleteAnrokIntegrationMappingMutation: (options: unknown) => mockDeleteAnrokMapping(options),
  useUpdateAnrokIntegrationCollectionMappingMutation: () => [jest.fn()],
  useUpdateAnrokIntegrationMappingMutation: (options: unknown) => mockUpdateAnrokMapping(options),
  useCreateAvalaraIntegrationCollectionMappingMutation: () => [jest.fn()],
  useCreateAvalaraIntegrationMappingMutation: (options: unknown) =>
    mockCreateAvalaraMapping(options),
  useDeleteAvalaraIntegrationCollectionMappingMutation: () => [jest.fn()],
  useDeleteAvalaraIntegrationMappingMutation: (options: unknown) =>
    mockDeleteAvalaraMapping(options),
  useUpdateAvalaraIntegrationCollectionMappingMutation: () => [jest.fn()],
  useUpdateAvalaraIntegrationMappingMutation: (options: unknown) =>
    mockUpdateAvalaraMapping(options),
}))

describe.each([
  {
    createMapping: mockCreateAnrokMapping,
    deleteMapping: mockDeleteAnrokMapping,
    queryName: 'getProductsForAnrokItemsList',
    updateMapping: mockUpdateAnrokMapping,
    useMappingCUD: useAnrokIntegrationMappingCUD,
  },
  {
    createMapping: mockCreateAvalaraMapping,
    deleteMapping: mockDeleteAvalaraMapping,
    queryName: 'getProductsForAvalaraItemsList',
    updateMapping: mockUpdateAvalaraMapping,
    useMappingCUD: useAvalaraIntegrationMappingCUD,
  },
])('$queryName', ({ createMapping, deleteMapping, queryName, updateMapping, useMappingCUD }) => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('refetches products after Product mapping changes', () => {
    renderHook(() => useMappingCUD(MappableTypeEnum.Product))

    const options = { refetchQueries: [queryName] }

    expect(createMapping).toHaveBeenCalledWith(options)
    expect(updateMapping).toHaveBeenCalledWith(options)
    expect(deleteMapping).toHaveBeenCalledWith(options)
  })
})
