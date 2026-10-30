export type Series = { key: string; label: string; color: string }

export type PeriodPoint = { time: string; isPartial: boolean } & Record<
  string,
  number | string | boolean
>
