export const expectConsoleError = async (
  expectedArgs: unknown[],
  run: () => Promise<void>,
): Promise<void> => {
  const error = jest.spyOn(console, 'error').mockImplementation(() => {})

  try {
    await run()
    expect(error).toHaveBeenCalledTimes(1)
    expect(error).toHaveBeenCalledWith(...expectedArgs)
  } finally {
    error.mockRestore()
  }
}
