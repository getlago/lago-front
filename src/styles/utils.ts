import clsx from 'classnames'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: clsx.ArgumentArray) => {
  return twMerge(clsx(inputs))
}
