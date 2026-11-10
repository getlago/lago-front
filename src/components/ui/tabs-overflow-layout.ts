export interface TabMeasurement {
  value: string
  width: number
}

export const partitionTabs = (
  items: TabMeasurement[],
  available: number,
  moreWidth: number,
  selected: string,
  promoted?: string,
  gap = 4,
): { visible: string[]; hidden: string[] } => {
  const total =
    items.reduce((sum, item) => sum + item.width, 0) + Math.max(0, items.length - 1) * gap

  if (total <= available) return { visible: items.map((item) => item.value), hidden: [] }
  const budget = Math.max(0, available - moreWidth - gap)
  const visible: TabMeasurement[] = []
  let used = 0

  for (const item of items) {
    const next = used + item.width + (visible.length ? gap : 0)

    if (next > budget) break
    visible.push(item)
    used = next
  }
  const active = items.find((item) => item.value === selected)
  const replacement =
    active && !visible.some((item) => item.value === selected)
      ? active
      : items.find((item) => item.value === promoted)

  const original = [...visible]

  if (replacement && !visible.some((item) => item.value === replacement.value)) {
    if (visible.length) visible.pop()
    while (
      visible.length &&
      visible.reduce((sum, item) => sum + item.width + gap, 0) + replacement.width > budget
    ) {
      visible.pop()
    }
    visible.push(replacement)
    if (active && !visible.some((item) => item.value === selected)) {
      visible.splice(0, visible.length, ...original)
    }
  }
  if (!visible.length && items.length) visible.push(active ?? items[0])
  const values = visible.map((item) => item.value)

  return {
    visible: values,
    hidden: items.filter((item) => !values.includes(item.value)).map((item) => item.value),
  }
}
