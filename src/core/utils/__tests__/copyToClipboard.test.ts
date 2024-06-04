import { copyToClipboard } from '../copyToClipboard'

Object.assign(window.navigator, {
  clipboard: {
    writeText: jest.fn().mockImplementation(() => Promise.resolve()),
  },
})

describe('copyToClipboard', () => {
  it('should copy to clipboard', () => {
    copyToClipboard('the text that needs to be copied')

    expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(
      'the text that needs to be copied',
    )
  })

  it('should filter out comments', () => {
    const value = `# comment
    the text that needs to be copied`

    copyToClipboard(value, { ignoreComment: true })
    expect(window.navigator.clipboard.writeText).toHaveBeenCalledWith(
      'the text that needs to be copied',
    )
  })
})
