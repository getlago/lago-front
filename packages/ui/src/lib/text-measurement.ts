const contexts = new WeakMap<Document, CanvasRenderingContext2D>()

export const getTextMeasurementContext = (
  ownerDocument: Document,
): CanvasRenderingContext2D | null => {
  const cached = contexts.get(ownerDocument)

  if (cached) return cached
  const context = ownerDocument.createElement('canvas').getContext('2d')

  if (context) contexts.set(ownerDocument, context)
  return context
}
