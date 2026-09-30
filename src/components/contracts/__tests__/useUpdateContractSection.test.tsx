import { renderHook } from '@testing-library/react'

import { useUpdateContractMutation } from '~/generated/graphql'

import { useUpdateContractSection } from '../useUpdateContractSection'

jest.mock('~/generated/graphql', () => ({
  ...jest.requireActual('~/generated/graphql'),
  useUpdateContractMutation: jest.fn(),
}))

jest.mock('~/core/apolloClient', () => ({ addToast: jest.fn() }))

const mockUpdate = jest.fn().mockResolvedValue({ data: { updateContract: { id: 'contract-1' } } })

describe('useUpdateContractSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useUpdateContractMutation as jest.Mock).mockReturnValue([mockUpdate, {}])
  })

  it('sends the given partial input', async () => {
    const { result } = renderHook(() => useUpdateContractSection())

    await result.current.updateContractSection({
      externalId: 'external-contract-1',
      consolidateInvoice: false,
    })

    expect(mockUpdate).toHaveBeenCalledWith({
      variables: { input: { externalId: 'external-contract-1', consolidateInvoice: false } },
    })
  })

  // So the (creation-shared) drawer's `await onSave()` keeps its draft intact instead of
  // closing on a failed save, regardless of whether Apollo rejected or resolved.
  it('rejects when the mutation resolves without a contract', async () => {
    mockUpdate.mockResolvedValueOnce({ data: { updateContract: null } })

    const { result } = renderHook(() => useUpdateContractSection())

    await expect(
      result.current.updateContractSection({ externalId: 'external-contract-1' }),
    ).rejects.toThrow()
  })
})
