import { ComponentType, createElement } from 'react'

const FUTURE = { v7_startTransition: true, v7_relativeSplatPath: true }

type RouterModule = {
  BrowserRouter: ComponentType<Record<string, unknown>>
  MemoryRouter: ComponentType<Record<string, unknown>>
}

export const withRouterFuture = (actual: RouterModule): RouterModule => ({
  BrowserRouter: (props: Record<string, unknown>) =>
    createElement(actual.BrowserRouter, { future: FUTURE, ...props }),
  MemoryRouter: (props: Record<string, unknown>) =>
    createElement(actual.MemoryRouter, { future: FUTURE, ...props }),
})
