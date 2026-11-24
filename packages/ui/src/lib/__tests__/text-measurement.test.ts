import { getTextMeasurementContext } from '../text-measurement'

it('reuses one canvas context per document', () => {
  const ownerDocument = document.implementation.createHTMLDocument()
  const context = {} as CanvasRenderingContext2D
  const getContext = jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context)

  expect(getTextMeasurementContext(ownerDocument)).toBe(context)
  expect(getTextMeasurementContext(ownerDocument)).toBe(context)
  expect(getContext).toHaveBeenCalledTimes(1)
  getContext.mockRestore()
})

it('falls back safely when canvas measurement is unavailable', () => {
  const ownerDocument = document.implementation.createHTMLDocument()
  const getContext = jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

  expect(getTextMeasurementContext(ownerDocument)).toBeNull()
  getContext.mockRestore()
})
