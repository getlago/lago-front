import clsx from 'classnames'
import { twMerge } from 'tailwind-merge'

export const tw = (...inputs: clsx.ArgumentArray) => {
  return twMerge(clsx(inputs))
}
