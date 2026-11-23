import { useRender } from '@base-ui/react/use-render'
import { Children, forwardRef, HTMLAttributes, ReactElement } from 'react'

export const RenderChild = forwardRef<HTMLElement, HTMLAttributes<HTMLElement>>(
  ({ children, ...props }, ref) =>
    useRender({ render: Children.only(children) as ReactElement, ref, props }),
)
RenderChild.displayName = 'RenderChild'
