import { CustomRouteObject } from '~/core/router/types'

import { getObjectCreationPaths } from '../utils'

jest.mock('~/core/router/ObjectsRoutes', () => ({
  objectCreationRoutes: [
    {
      path: ['/create/plans', '/update/plan/:planId'],
      private: true,
    },
    {
      path: '/create/invoice',
      private: true,
    },
    {
      path: undefined,
      private: true,
    },
  ] as CustomRouteObject[],
}))

jest.mock('~/core/router/CustomerRoutes', () => ({
  customerObjectCreationRoutes: [
    {
      path: '/customer/:customerId/request-overdue-payment',
      private: true,
    },
    {
      path: ['/customer/:customerId/invoice/:invoiceId/create/credit-notes'],
      private: true,
    },
  ] as CustomRouteObject[],
  customerVoidRoutes: [
    {
      path: '/customer/:customerId/invoice/void/:invoiceId',
      private: true,
    },
    {
      path: '/customer/:customerId/invoice/regenerate/:invoiceId',
      private: true,
    },
  ] as CustomRouteObject[],
}))

describe('getObjectCreationPaths', () => {
  it('should transform all routes into path objects', () => {
    const result = getObjectCreationPaths()

    expect(result).toHaveLength(7)
    expect(result).toEqual([
      { path: '/create/plans' },
      { path: '/update/plan/:planId' },
      { path: '/create/invoice' },
      { path: '/customer/:customerId/request-overdue-payment' },
      { path: '/customer/:customerId/invoice/:invoiceId/create/credit-notes' },
      { path: '/customer/:customerId/invoice/void/:invoiceId' },
      { path: '/customer/:customerId/invoice/regenerate/:invoiceId' },
    ])
  })

  it('should handle routes with array paths', () => {
    const result = getObjectCreationPaths()

    // Should flatten array paths into individual path objects
    const planPaths = result.filter((p) => p.path.includes('/plan'))

    expect(planPaths).toHaveLength(2)
    expect(planPaths).toContainEqual({ path: '/create/plans' })
    expect(planPaths).toContainEqual({ path: '/update/plan/:planId' })
  })

  it('should handle routes with single string paths', () => {
    const result = getObjectCreationPaths()

    const invoicePath = result.find((p) => p.path === '/create/invoice')

    expect(invoicePath).toEqual({ path: '/create/invoice' })
  })

  it('should skip routes without path property', () => {
    const result = getObjectCreationPaths()

    // Should not include routes with undefined path
    expect(result.every((p) => p.path !== undefined)).toBe(true)
  })

  it('should include paths from objectCreationRoutes, customerObjectCreationRoutes, and customerVoidRoutes', () => {
    const result = getObjectCreationPaths()

    // Check objectCreationRoutes paths
    expect(result.some((p) => p.path === '/create/plans')).toBe(true)
    expect(result.some((p) => p.path === '/create/invoice')).toBe(true)

    // Check customerObjectCreationRoutes paths
    expect(result.some((p) => p.path === '/customer/:customerId/request-overdue-payment')).toBe(
      true,
    )
    expect(
      result.some((p) => p.path === '/customer/:customerId/invoice/:invoiceId/create/credit-notes'),
    ).toBe(true)

    // Check customerVoidRoutes paths
    expect(result.some((p) => p.path === '/customer/:customerId/invoice/void/:invoiceId')).toBe(
      true,
    )
    expect(
      result.some((p) => p.path === '/customer/:customerId/invoice/regenerate/:invoiceId'),
    ).toBe(true)
  })
})
