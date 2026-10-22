import {
  AttributionHierarchyType,
  buildAttributionFilters,
  flattenAttributionHierarchyTypes,
  getAttributionChildLevels,
  getAttributionHierarchyChain,
  getAttributionNodeKey,
  getDeepestAttributionHierarchyType,
} from '../attributionTree'

const userType: AttributionHierarchyType = { id: 'type-user', code: 'user', name: 'User' }
const teamType: AttributionHierarchyType = {
  id: 'type-team',
  code: 'team',
  name: 'Team',
  children: [userType],
}
const costCenterType: AttributionHierarchyType = {
  id: 'type-cost-center',
  code: 'cost_center',
  name: null,
}
const departmentType: AttributionHierarchyType = {
  id: 'type-department',
  code: 'department',
  name: 'Department',
  children: [teamType, costCenterType],
}
const regionType: AttributionHierarchyType = { id: 'type-region', code: 'region', name: 'Region' }

const roots = [departmentType, regionType]
const apiKeyType = { code: 'api_key', name: 'API Key' }

describe('attributionTree', () => {
  describe('buildAttributionFilters', () => {
    describe('GIVEN an empty path', () => {
      it('THEN should return no filters', () => {
        expect(buildAttributionFilters([])).toEqual([])
      })
    })

    describe('GIVEN a path of attributed values', () => {
      it('THEN should return one filter per ancestor in root to leaf order', () => {
        expect(
          buildAttributionFilters([
            { code: 'department', value: 'rnd' },
            { code: 'team', value: 'eng' },
          ]),
        ).toEqual([
          { code: 'department', values: ['rnd'] },
          { code: 'team', values: ['eng'] },
        ])
      })
    })

    describe('GIVEN a path ending on an unattributed row', () => {
      it('THEN should filter that level on an empty value', () => {
        expect(
          buildAttributionFilters([
            { code: 'department', value: 'rnd' },
            { code: 'team', value: null },
          ]),
        ).toEqual([
          { code: 'department', values: ['rnd'] },
          { code: 'team', values: [''] },
        ])
      })
    })
  })

  describe('getAttributionNodeKey', () => {
    describe('GIVEN an attributed and an unattributed path on the same level', () => {
      it('THEN should return distinct keys', () => {
        expect(getAttributionNodeKey([{ code: 'team', value: '' }])).not.toEqual(
          getAttributionNodeKey([{ code: 'team', value: null }]),
        )
      })
    })
  })

  describe('flattenAttributionHierarchyTypes', () => {
    describe('GIVEN nested hierarchical types', () => {
      it('THEN should list them depth first with their depth', () => {
        expect(
          flattenAttributionHierarchyTypes(roots).map(({ type, depth }) => [type.code, depth]),
        ).toEqual([
          ['department', 0],
          ['team', 1],
          ['user', 2],
          ['cost_center', 1],
          ['region', 0],
        ])
      })
    })
  })

  describe('getDeepestAttributionHierarchyType', () => {
    describe('GIVEN nested hierarchical types', () => {
      it('THEN should return the lowest level', () => {
        expect(getDeepestAttributionHierarchyType(roots)?.code).toBe('user')
      })
    })

    describe('GIVEN several types on the deepest level', () => {
      it('THEN should return the first one in depth first order', () => {
        expect(getDeepestAttributionHierarchyType([regionType, costCenterType])?.code).toBe(
          'region',
        )
      })
    })

    describe('GIVEN no hierarchical type', () => {
      it('THEN should return null', () => {
        expect(getDeepestAttributionHierarchyType([])).toBeNull()
      })
    })
  })

  describe('getAttributionHierarchyChain', () => {
    describe('GIVEN a nested type code', () => {
      it('THEN should return its ancestors from the root', () => {
        expect(getAttributionHierarchyChain(roots, 'user').map(({ code }) => code)).toEqual([
          'department',
          'team',
          'user',
        ])
      })
    })

    describe('GIVEN an unknown type code', () => {
      it('THEN should return an empty chain', () => {
        expect(getAttributionHierarchyChain(roots, 'unknown')).toEqual([])
      })
    })
  })

  describe('getAttributionChildLevels', () => {
    describe('GIVEN no flat key is listed', () => {
      describe('WHEN resolving the first level', () => {
        it('THEN should return every root type', () => {
          expect(getAttributionChildLevels({ roots, parentCode: null, listBy: null })).toEqual([
            { code: 'department', name: 'Department', isLeaf: false },
            { code: 'region', name: 'Region', isLeaf: true },
          ])
        })
      })

      describe('WHEN resolving the children of a type with several child types', () => {
        it('THEN should return one level per child type, falling back to the code as name', () => {
          expect(
            getAttributionChildLevels({ roots, parentCode: 'department', listBy: null }),
          ).toEqual([
            { code: 'team', name: 'Team', isLeaf: false },
            { code: 'cost_center', name: 'cost_center', isLeaf: true },
          ])
        })
      })

      describe('WHEN resolving the children of a leaf type', () => {
        it('THEN should return no level', () => {
          expect(getAttributionChildLevels({ roots, parentCode: 'user', listBy: null })).toEqual([])
        })
      })
    })

    describe('GIVEN a flat key listed under a hierarchical level', () => {
      const listBy = { flatType: apiKeyType, underCode: 'team' }

      describe('WHEN resolving the first level', () => {
        it('THEN should return only the root of the under chain', () => {
          expect(getAttributionChildLevels({ roots, parentCode: null, listBy })).toEqual([
            { code: 'department', name: 'Department', isLeaf: false },
          ])
        })
      })

      describe('WHEN resolving the children of an ancestor of the under level', () => {
        it('THEN should return the next type of the chain only', () => {
          expect(getAttributionChildLevels({ roots, parentCode: 'department', listBy })).toEqual([
            { code: 'team', name: 'Team', isLeaf: false },
          ])
        })
      })

      describe('WHEN resolving the children of the under level', () => {
        it('THEN should return the flat key as a leaf level', () => {
          expect(getAttributionChildLevels({ roots, parentCode: 'team', listBy })).toEqual([
            { code: 'api_key', name: 'API Key', isLeaf: true },
          ])
        })
      })

      describe('WHEN resolving the children of a type outside the chain', () => {
        it('THEN should return no level', () => {
          expect(getAttributionChildLevels({ roots, parentCode: 'region', listBy })).toEqual([])
        })
      })
    })

    describe('GIVEN a flat key listed under a root level', () => {
      it('THEN should expand the root values into the flat key', () => {
        const listBy = { flatType: apiKeyType, underCode: 'department' }

        expect(getAttributionChildLevels({ roots, parentCode: null, listBy })).toEqual([
          { code: 'department', name: 'Department', isLeaf: false },
        ])
        expect(getAttributionChildLevels({ roots, parentCode: 'department', listBy })).toEqual([
          { code: 'api_key', name: 'API Key', isLeaf: true },
        ])
      })
    })

    describe('GIVEN an under level that no longer exists', () => {
      it('THEN should return no level', () => {
        const listBy = { flatType: apiKeyType, underCode: 'unknown' }

        expect(getAttributionChildLevels({ roots, parentCode: null, listBy })).toEqual([])
      })
    })
  })
})
