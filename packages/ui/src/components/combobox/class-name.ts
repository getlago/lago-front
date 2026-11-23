import { cn } from '../../lib/utils'

export function comboboxClassName<State>(
  base: string,
  className?: string | ((state: State) => string | undefined),
): string | ((state: State) => string) {
  return typeof className === 'function'
    ? (state) => cn(base, className(state))
    : cn(base, className)
}
