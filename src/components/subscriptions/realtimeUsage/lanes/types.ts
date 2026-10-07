export type SortMode = 'volume' | 'name'

export type Lane = {
  key: string
  label: string
  color: string
  values: number[]
  sum: number
  now: number
}
