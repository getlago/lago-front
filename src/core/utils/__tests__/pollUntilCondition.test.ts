import { pollUntilCondition } from '../pollUntilCondition'

describe('pollUntilCondition', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should wait for pollInterval before making the first fetch call', async () => {
    const fetchFn = jest.fn().mockResolvedValue('success')
    const conditionFn = jest.fn().mockReturnValue(true)

    const pollPromise = pollUntilCondition(fetchFn, conditionFn, {
      maxAttempts: 3,
      pollInterval: 1000,
    })

    // fetchFn should not be called immediately
    expect(fetchFn).not.toHaveBeenCalled()

    // Advance timer by 999ms - still should not be called
    await jest.advanceTimersByTimeAsync(999)
    expect(fetchFn).not.toHaveBeenCalled()

    // Advance timer by 1ms more (total 1000ms) - now it should be called
    await jest.advanceTimersByTimeAsync(1)
    expect(fetchFn).toHaveBeenCalledTimes(1)

    await pollPromise
  })

  it('should stop polling when condition is met', async () => {
    const fetchFn = jest.fn().mockResolvedValue('done')
    const conditionFn = jest.fn().mockReturnValue(true)

    const pollPromise = pollUntilCondition(fetchFn, conditionFn, {
      maxAttempts: 3,
      pollInterval: 1000,
    })

    await jest.advanceTimersByTimeAsync(1000)

    const result = await pollPromise

    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ data: 'done', conditionMet: true })
  })

  it('should continue polling until condition is met', async () => {
    const fetchFn = jest
      .fn()
      .mockResolvedValueOnce('pending')
      .mockResolvedValueOnce('pending')
      .mockResolvedValueOnce('success')

    const conditionFn = jest.fn((data) => data === 'success')

    const pollPromise = pollUntilCondition(fetchFn, conditionFn, {
      maxAttempts: 5,
      pollInterval: 1000,
    })

    // First poll
    await jest.advanceTimersByTimeAsync(1000)
    expect(fetchFn).toHaveBeenCalledTimes(1)
    expect(conditionFn).toHaveBeenCalledWith('pending')

    // Second poll
    await jest.advanceTimersByTimeAsync(1000)
    expect(fetchFn).toHaveBeenCalledTimes(2)

    // Third poll - condition met
    await jest.advanceTimersByTimeAsync(1000)
    expect(fetchFn).toHaveBeenCalledTimes(3)

    const result = await pollPromise

    expect(result).toEqual({ data: 'success', conditionMet: true })
  })

  it('should stop after maxAttempts if condition is never met', async () => {
    const fetchFn = jest.fn().mockResolvedValue('pending')
    const conditionFn = jest.fn().mockReturnValue(false)

    const pollPromise = pollUntilCondition(fetchFn, conditionFn, {
      maxAttempts: 3,
      pollInterval: 1000,
    })

    // Advance through all 3 attempts
    await jest.advanceTimersByTimeAsync(3000)

    const result = await pollPromise

    expect(fetchFn).toHaveBeenCalledTimes(3)
    expect(result).toEqual({ data: null, conditionMet: false })
  })

  it('should respect different poll intervals', async () => {
    const fetchFn = jest.fn().mockResolvedValue('data')
    const conditionFn = jest.fn().mockReturnValue(true)

    const pollPromise = pollUntilCondition(fetchFn, conditionFn, {
      maxAttempts: 3,
      pollInterval: 500,
    })

    // Should not call before 500ms
    await jest.advanceTimersByTimeAsync(499)
    expect(fetchFn).not.toHaveBeenCalled()

    // Should call at 500ms
    await jest.advanceTimersByTimeAsync(1)
    expect(fetchFn).toHaveBeenCalledTimes(1)

    await pollPromise
  })

  it('should wait between each poll attempt', async () => {
    const fetchFn = jest.fn().mockResolvedValue('pending')
    const conditionFn = jest.fn().mockReturnValue(false)

    const pollPromise = pollUntilCondition(fetchFn, conditionFn, {
      maxAttempts: 3,
      pollInterval: 1000,
    })

    // First attempt after 1000ms
    await jest.advanceTimersByTimeAsync(1000)
    expect(fetchFn).toHaveBeenCalledTimes(1)

    // Second attempt after another 1000ms (total 2000ms)
    await jest.advanceTimersByTimeAsync(1000)
    expect(fetchFn).toHaveBeenCalledTimes(2)

    // Third attempt after another 1000ms (total 3000ms)
    await jest.advanceTimersByTimeAsync(1000)
    expect(fetchFn).toHaveBeenCalledTimes(3)

    await pollPromise
  })
})
