import { ChargeUsage } from '~/generated/graphql'

import { formatGroupedUsage } from '../formatCustomerUsage'

describe('formatCustomerUsage', () => {
  describe('formatGroupedUsage', () => {
    it('should return undefined if groupedChargesUsage is empty', () => {
      expect(formatGroupedUsage(undefined)).toBeUndefined()
    })

    it('should return groups ordered with 1 groupd and no groupBy', () => {
      const groupedChargesUsage = {
        groupedUsage: [
          {
            groupedBy: {},
            groups: [
              {
                key: 'key1',
                value: 'value1',
                invoiceDisplayName: 'invoiceDisplayName1',
              },
              {
                key: 'key2',
                value: 'value2',
                invoiceDisplayName: 'invoiceDisplayName2',
              },
            ],
          },
        ],
      } as ChargeUsage

      expect(formatGroupedUsage(groupedChargesUsage)).toEqual([
        {
          displayName: 'invoiceDisplayName1',
          key: 'key1',
          value: 'value1',
          invoiceDisplayName: 'invoiceDisplayName1',
        },
        {
          displayName: 'invoiceDisplayName2',
          key: 'key2',
          value: 'value2',
          invoiceDisplayName: 'invoiceDisplayName2',
        },
      ])
    })

    it('should return groups ordered with 1 groupd and 1 groupBy', () => {
      const groupedChargesUsage = {
        groupedUsage: [
          {
            groupedBy: {
              key1: 'value1',
            },
            groups: [
              {
                key: 'key1',
                value: 'value1',
                invoiceDisplayName: 'invoiceDisplayName1',
              },
              {
                key: 'key2',
                value: 'value2',
                invoiceDisplayName: 'invoiceDisplayName2',
              },
            ],
          },
        ],
      } as ChargeUsage

      expect(formatGroupedUsage(groupedChargesUsage)).toEqual([
        {
          displayName: 'value1 • invoiceDisplayName1',
          key: 'key1',
          value: 'value1',
          invoiceDisplayName: 'invoiceDisplayName1',
        },
        {
          displayName: 'value1 • invoiceDisplayName2',
          key: 'key2',
          value: 'value2',
          invoiceDisplayName: 'invoiceDisplayName2',
        },
      ])
    })

    it('should return groups ordered with 1 groupd and 2 groupBy', () => {
      const groupedChargesUsage = {
        groupedUsage: [
          {
            groupedBy: {
              key1: 'value1',
              key2: 'value2',
            },
            groups: [
              {
                key: 'key1',
                value: 'value1',
                invoiceDisplayName: 'invoiceDisplayName1',
              },
              {
                key: 'key2',
                value: 'value2',
                invoiceDisplayName: 'invoiceDisplayName2',
              },
            ],
          },
        ],
      } as ChargeUsage

      expect(formatGroupedUsage(groupedChargesUsage)).toEqual([
        {
          displayName: 'value1 • value2 • invoiceDisplayName1',
          key: 'key1',
          value: 'value1',
          invoiceDisplayName: 'invoiceDisplayName1',
        },
        {
          displayName: 'value1 • value2 • invoiceDisplayName2',
          key: 'key2',
          value: 'value2',
          invoiceDisplayName: 'invoiceDisplayName2',
        },
      ])
    })

    it('should return groups ordered with 2 groupd and 1 groupBy', () => {
      const groupedChargesUsage = {
        groupedUsage: [
          {
            groupedBy: {
              key1: 'value1',
            },
            groups: [
              {
                key: 'key1',
                value: 'value1',
                invoiceDisplayName: 'invoiceDisplayName1',
              },
              {
                key: 'key2',
                value: 'value2',
                invoiceDisplayName: 'invoiceDisplayName2',
              },
            ],
          },
          {
            groupedBy: {
              key1: 'value1',
            },
            groups: [
              {
                key: 'key1',
                value: 'value1',
                invoiceDisplayName: 'invoiceDisplayName1',
              },
              {
                key: 'key2',
                value: 'value2',
                invoiceDisplayName: 'invoiceDisplayName2',
              },
            ],
          },
        ],
      } as ChargeUsage

      expect(formatGroupedUsage(groupedChargesUsage)).toEqual([
        {
          displayName: 'value1 • invoiceDisplayName1',
          key: 'key1',
          value: 'value1',
          invoiceDisplayName: 'invoiceDisplayName1',
        },
        {
          displayName: 'value1 • invoiceDisplayName1',
          key: 'key1',
          value: 'value1',
          invoiceDisplayName: 'invoiceDisplayName1',
        },
        {
          displayName: 'value1 • invoiceDisplayName2',
          key: 'key2',
          value: 'value2',
          invoiceDisplayName: 'invoiceDisplayName2',
        },
        {
          displayName: 'value1 • invoiceDisplayName2',
          key: 'key2',
          value: 'value2',
          invoiceDisplayName: 'invoiceDisplayName2',
        },
      ])
    })

    it('should return groups ordered with 2 group, 2 groupBy and 1 groupBy with no value', () => {
      const groupedChargesUsage = {
        groupedUsage: [
          {
            groupedBy: {
              key1: 'value1',
              key2: 'value2',
            },
            groups: [
              {
                key: 'key1',
                value: 'value1',
                invoiceDisplayName: 'invoiceDisplayName1',
              },
              {
                key: 'key2',
                value: 'value2',
                invoiceDisplayName: 'invoiceDisplayName2',
              },
            ],
          },
          {
            groupedBy: {
              key1: 'value1',
              key2: 'value2',
            },
            groups: [
              {
                key: 'key1',
                value: 'value1',
                invoiceDisplayName: 'invoiceDisplayName1',
              },
              {
                key: 'key2',
                value: 'value2',
                invoiceDisplayName: 'invoiceDisplayName2',
              },
            ],
          },
          {
            groupedBy: {
              key1: 'value1',
            },
            groups: [
              {
                key: 'key1',
                value: 'value1',
                invoiceDisplayName: 'invoiceDisplayName1',
              },
              {
                key: 'key2',
                value: 'value2',
                invoiceDisplayName: 'invoiceDisplayName2',
              },
            ],
          },
        ],
      } as ChargeUsage

      expect(formatGroupedUsage(groupedChargesUsage)).toEqual([
        {
          key: 'key1',
          value: 'value1',
          invoiceDisplayName: 'invoiceDisplayName1',
          displayName: 'value1 • invoiceDisplayName1',
        },
        {
          key: 'key2',
          value: 'value2',
          invoiceDisplayName: 'invoiceDisplayName2',
          displayName: 'value1 • invoiceDisplayName2',
        },
        {
          key: 'key1',
          value: 'value1',
          invoiceDisplayName: 'invoiceDisplayName1',
          displayName: 'value1 • value2 • invoiceDisplayName1',
        },
        {
          key: 'key1',
          value: 'value1',
          invoiceDisplayName: 'invoiceDisplayName1',
          displayName: 'value1 • value2 • invoiceDisplayName1',
        },
        {
          key: 'key2',
          value: 'value2',
          invoiceDisplayName: 'invoiceDisplayName2',
          displayName: 'value1 • value2 • invoiceDisplayName2',
        },
        {
          key: 'key2',
          value: 'value2',
          invoiceDisplayName: 'invoiceDisplayName2',
          displayName: 'value1 • value2 • invoiceDisplayName2',
        },
      ])
    })
  })
})
