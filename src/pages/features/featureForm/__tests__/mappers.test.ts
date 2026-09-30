import { FeatureForFeatureFormFragment, PrivilegeValueTypeEnum } from '~/generated/graphql'

import { mapFeatureToFormValues, mapPrivilegesToApiInput } from '../mappers'
import { emptyFeatureDefaultValues } from '../validationSchema'

const aFeature = (
  overrides: Partial<FeatureForFeatureFormFragment> = {},
): FeatureForFeatureFormFragment => ({
  id: 'feature-1',
  name: 'Seats',
  code: 'seats',
  description: 'How many seats',
  privileges: [],
  ...overrides,
})

describe('mapFeatureToFormValues', () => {
  describe('GIVEN no feature', () => {
    describe('WHEN mapping it', () => {
      it('THEN should return the empty defaults', () => {
        expect(mapFeatureToFormValues(undefined)).toEqual(emptyFeatureDefaultValues)
      })
    })
  })

  describe('GIVEN a feature with nullable fields', () => {
    describe('WHEN mapping it', () => {
      it('THEN should replace every null by an empty string', () => {
        expect(mapFeatureToFormValues(aFeature({ name: null, description: null }))).toEqual({
          name: '',
          code: 'seats',
          description: '',
          privileges: [],
        })
      })
    })
  })

  describe('GIVEN a feature with privileges', () => {
    describe('WHEN mapping it', () => {
      it('THEN should keep only the form fields, dropping __typename', () => {
        const mapped = mapFeatureToFormValues(
          aFeature({
            privileges: [
              {
                __typename: 'PrivilegeObject',
                id: 'privilege-1',
                name: null,
                code: 'max_seats',
                valueType: PrivilegeValueTypeEnum.Select,
                config: { __typename: 'PrivilegeConfigObject', selectOptions: ['a', 'b'] },
              },
            ],
          }),
        )

        expect(mapped.privileges).toEqual([
          {
            id: 'privilege-1',
            name: '',
            code: 'max_seats',
            valueType: PrivilegeValueTypeEnum.Select,
            config: { selectOptions: ['a', 'b'] },
          },
        ])
      })

      it('THEN should leave the config undefined when there is no select option', () => {
        const mapped = mapFeatureToFormValues(
          aFeature({
            privileges: [
              {
                id: 'privilege-1',
                name: 'Max seats',
                code: 'max_seats',
                valueType: PrivilegeValueTypeEnum.Integer,
                config: { selectOptions: null },
              },
            ],
          }),
        )

        expect(mapped.privileges[0].config).toBeUndefined()
      })
    })
  })
})

describe('mapPrivilegesToApiInput', () => {
  describe('GIVEN a privilege that is not a select', () => {
    describe('WHEN mapping it to the API input', () => {
      it('THEN should drop its config and its id', () => {
        expect(
          mapPrivilegesToApiInput([
            {
              id: 'privilege-1',
              name: 'Max seats',
              code: 'max_seats',
              valueType: PrivilegeValueTypeEnum.Integer,
              config: { selectOptions: ['a'] },
            },
          ]),
        ).toEqual([
          {
            name: 'Max seats',
            code: 'max_seats',
            valueType: PrivilegeValueTypeEnum.Integer,
            config: undefined,
          },
        ])
      })
    })
  })

  describe('GIVEN a select privilege', () => {
    describe('WHEN mapping it to the API input', () => {
      it('THEN should keep its select options', () => {
        expect(
          mapPrivilegesToApiInput([
            {
              name: 'Plan tier',
              code: 'plan_tier',
              valueType: PrivilegeValueTypeEnum.Select,
              config: { selectOptions: ['gold', 'silver'] },
            },
          ]),
        ).toEqual([
          {
            name: 'Plan tier',
            code: 'plan_tier',
            valueType: PrivilegeValueTypeEnum.Select,
            config: { selectOptions: ['gold', 'silver'] },
          },
        ])
      })
    })
  })
})
