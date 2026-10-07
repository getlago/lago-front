export type Series = { key: string; label: string; color: string }

export type HourPoint = { time: string; isPartial: boolean } & Record<
  string,
  number | string | boolean
>
