import { ComponentType, createElement, ReactElement } from 'react'

import { ROUTER_FUTURE_FLAGS } from '~/core/router/futureFlags'

type RouterModule = {
  BrowserRouter: ComponentType<Record<string, unknown>>
  MemoryRouter: ComponentType<Record<string, unknown>>
}

export const withRouterFuture = (actual: RouterModule): RouterModule => ({
  BrowserRouter: (props: Record<string, unknown>): ReactElement =>
    createElement(actual.BrowserRouter, { future: ROUTER_FUTURE_FLAGS, ...props }),
  MemoryRouter: (props: Record<string, unknown>): ReactElement =>
    createElement(actual.MemoryRouter, { future: ROUTER_FUTURE_FLAGS, ...props }),
})
