import { PrivilegeValueTypeEnum } from '~/generated/graphql'

import {
  mapEntitlementToFormValues,
  mapPrivilegeConfigToFormValue,
  mapPrivilegesToApiInput,
} from '../mappers'
import { emptySubscriptionEntitlementDefaultValues } from '../validationSchema'

describe('subscriptionEntitlementForm mappers', () => {
  describe('mapEntitlementToFormValues', () => {
    describe('GIVEN no entitlement', () => {
      describe('WHEN mapping it', () => {
        it('THEN should return the empty default values', () => {
          expect(mapEntitlementToFormValues(undefined)).toEqual(
            emptySubscriptionEntitlementDefaultValues,
          )
        })
      })
    })

    describe('GIVEN an entitlement with privileges', () => {
      describe('WHEN mapping it', () => {
        it('THEN should map every privilege to the form shape', () => {
          expect(
            mapEntitlementToFormValues({
              code: 'feat_a',
              name: 'Feature A',
              privileges: [
                {
                  code: 'tier',
                  name: 'Tier',
                  value: 'gold',
                  valueType: PrivilegeValueTypeEnum.Select,
                  config: { selectOptions: ['gold', 'silver'] },
                },
              ],
            }),
          ).toEqual({
            code: 'feat_a',
            privileges: [
              {
                code: 'tier',
                name: 'Tier',
                value: 'gold',
                valueType: PrivilegeValueTypeEnum.Select,
                config: { selectOptions: ['gold', 'silver'] },
              },
            ],
          })
        })

        it('THEN should fall back to empty strings on nullish privilege fields', () => {
          expect(
            mapEntitlementToFormValues({
              code: 'feat_a',
              name: 'Feature A',
              privileges: [
                {
                  code: 'seats',
                  name: null,
                  value: null,
                  valueType: PrivilegeValueTypeEnum.Integer,
                  config: { selectOptions: null },
                },
              ],
            }).privileges[0],
          ).toEqual({
            code: 'seats',
            name: '',
            value: '',
            valueType: PrivilegeValueTypeEnum.Integer,
            config: undefined,
          })
        })
      })
    })
  })

  describe('mapPrivilegeConfigToFormValue', () => {
    describe.each([
      ['null config', null],
      ['undefined config', undefined],
      ['config without options', { selectOptions: null }],
    ])('GIVEN a %s', (_, config) => {
      describe('WHEN mapping it', () => {
        it('THEN should return undefined', () => {
          expect(mapPrivilegeConfigToFormValue(config)).toBeUndefined()
        })
      })
    })

    describe('GIVEN a config with an empty option list', () => {
      describe('WHEN mapping it', () => {
        it('THEN should keep the empty list', () => {
          expect(mapPrivilegeConfigToFormValue({ selectOptions: [] })).toEqual({
            selectOptions: [],
          })
        })
      })
    })

    describe('GIVEN a config with options', () => {
      describe('WHEN mapping it', () => {
        // The GraphQL payload carries __typename; keeping it would make the form
        // dirty against a freshly-reset default.
        it('THEN should keep only the select options', () => {
          expect(
            mapPrivilegeConfigToFormValue({
              __typename: 'PrivilegeConfigObject',
              selectOptions: ['a'],
            } as never),
          ).toEqual({ selectOptions: ['a'] })
        })
      })
    })
  })

  describe('mapPrivilegesToApiInput', () => {
    describe('GIVEN form privileges', () => {
      describe('WHEN mapping them to the API input', () => {
        it('THEN should keep only the privilege code and value', () => {
          expect(
            mapPrivilegesToApiInput([
              {
                code: 'tier',
                name: 'Tier',
                value: 'gold',
                valueType: PrivilegeValueTypeEnum.Select,
                config: { selectOptions: ['gold'] },
              },
            ]),
          ).toEqual([{ privilegeCode: 'tier', value: 'gold' }])
        })
      })
    })
  })
})
