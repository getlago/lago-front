import { GroupLevelEnum, determineGroupDiffLevel } from '../BMGroupUtils'

describe('BMGroupUtils', () => {
  describe('determineGroupDiffLevel', () => {
    describe('when groups and values are the same', () => {
      it('should return NoChange level for one dimension', () => {
        const group1 = {
          key: 'key',
          values: ['value1', 'value2'],
        }
        const group2 = {
          key: 'key',
          values: ['value1', 'value2'],
        }
        const result = determineGroupDiffLevel(group1, group2)

        expect(result).toEqual(GroupLevelEnum.NoChange)
      })
      it('should return NoChange level for two dimension', () => {
        const group1 = {
          key: 'key',
          values: [
            {
              name: 'name',
              key: 'key',
              values: ['value1', 'value2'],
            },
          ],
        }
        const group2 = {
          key: 'key',
          values: [
            {
              name: 'name',
              key: 'key',
              values: ['value1', 'value2'],
            },
          ],
        }
        const result = determineGroupDiffLevel(group1, group2)

        expect(result).toEqual(GroupLevelEnum.NoChange)
      })
    })

    describe("when groups don't have the same type", () => {
      it('should return NoChange level for one dimension', () => {
        const group1 = '{ "key": "key", "values": ["value1", "value2"] }'
        const group2 = {
          key: 'key',
          values: ['value1', 'value2'],
        }
        const result = determineGroupDiffLevel(group1, group2)

        expect(result).toEqual(GroupLevelEnum.NoChange)
      })
      it('should return NoChange level for two dimension', () => {
        const group1 = {
          key: 'key',
          values: [
            {
              name: 'name',
              key: 'key',
              values: ['value1', 'value2'],
            },
          ],
        }
        const group2 =
          '{ "key": "key", "values": [{ "name": "name", "key": "key", "values": ["value1", "value2"] }] }'
        const result = determineGroupDiffLevel(group1, group2)

        expect(result).toEqual(GroupLevelEnum.NoChange)
      })
    })

    describe('when groups have the same level but different values order', () => {
      describe('for one dimension group', () => {
        it('should return NoChange level', () => {
          const group1 = {
            key: 'key',
            values: ['value1', 'value2'],
          }
          const group2 = {
            key: 'key',
            values: ['value2', 'value1'],
          }
          const result = determineGroupDiffLevel(group1, group2)

          expect(result).toEqual(GroupLevelEnum.NoChange)
        })
      })
      describe('for two dimension group', () => {
        it('should return NoChange level', () => {
          const group1 = {
            key: 'key',
            values: [
              {
                name: 'name',
                key: 'key',
                values: ['value1', 'value2'],
              },
            ],
          }
          const group2 = {
            key: 'key',
            values: [
              {
                name: 'name',
                key: 'key',
                values: ['value2', 'value1'],
              },
            ],
          }
          const result = determineGroupDiffLevel(group1, group2)

          expect(result).toEqual(GroupLevelEnum.NoChange)
        })
      })
    })

    describe('when groups have the same level but different values', () => {
      describe('for one dimension group', () => {
        it('should return AddOrRemove level', () => {
          const group1 = {
            key: 'key',
            values: ['value1', 'value2'],
          }
          const group2 = {
            key: 'key',
            values: ['value1', 'value3'],
          }
          const result = determineGroupDiffLevel(group1, group2)

          expect(result).toEqual(GroupLevelEnum.AddOrRemove)
        })
      })
      describe('for two dimension group', () => {
        it('should return AddOrRemove level', () => {
          const group1 = {
            key: 'key',
            values: [
              {
                name: 'name',
                key: 'key',
                values: ['value1', 'value2'],
              },
            ],
          }
          const group2 = {
            key: 'key',
            values: [
              {
                name: 'name',
                key: 'key',
                values: ['value1', 'value3'],
              },
            ],
          }
          const result = determineGroupDiffLevel(group1, group2)

          expect(result).toEqual(GroupLevelEnum.AddOrRemove)
        })
      })
    })

    describe('when a value is added', () => {
      describe('for one dimension group', () => {
        it('should return AddOrRemove level', () => {
          const group1 = {
            key: 'key',
            values: ['value1', 'value2'],
          }
          const group2 = {
            key: 'key',
            values: ['value1', 'value2', 'value3'],
          }
          const result = determineGroupDiffLevel(group1, group2)

          expect(result).toEqual(GroupLevelEnum.AddOrRemove)
        })
      })
      describe('for two dimension group', () => {
        it('should return AddOrRemove level', () => {
          const group1 = {
            key: 'key',
            values: [
              {
                name: 'name',
                key: 'key',
                values: ['value1', 'value2'],
              },
            ],
          }
          const group2 = {
            key: 'key',
            values: [
              {
                name: 'name',
                key: 'key',
                values: ['value1', 'value2', 'value3'],
              },
            ],
          }
          const result = determineGroupDiffLevel(group1, group2)

          expect(result).toEqual(GroupLevelEnum.AddOrRemove)
        })
      })
    })

    describe('when a value is removed', () => {
      describe('for one dimension group', () => {
        it('should return AddOrRemove level', () => {
          const group1 = {
            key: 'key',
            values: ['value1', 'value2'],
          }
          const group2 = {
            key: 'key',
            values: ['value1'],
          }
          const result = determineGroupDiffLevel(group1, group2)

          expect(result).toEqual(GroupLevelEnum.AddOrRemove)
        })
      })
      describe('for two dimension group', () => {
        it('should return AddOrRemove level', () => {
          const group1 = {
            key: 'key',
            values: [
              {
                name: 'name',
                key: 'key',
                values: ['value1', 'value2'],
              },
            ],
          }
          const group2 = {
            key: 'key',
            values: [
              {
                name: 'name',
                key: 'key',
                values: ['value1'],
              },
            ],
          }
          const result = determineGroupDiffLevel(group1, group2)

          expect(result).toEqual(GroupLevelEnum.AddOrRemove)
        })
      })
    })

    describe('when key is different', () => {
      describe('for one dimension group', () => {
        it('should return AddOrRemove level', () => {
          const group1 = {
            key: 'key1',
            values: ['value1', 'value2'],
          }
          const group2 = {
            key: 'key2',
            values: ['value1', 'value2'],
          }
          const result = determineGroupDiffLevel(group1, group2)

          expect(result).toEqual(GroupLevelEnum.AddOrRemove)
        })
      })
      describe('for two dimension group, for primary key', () => {
        it('should return AddOrRemove level', () => {
          const group1 = {
            key: 'key1',
            values: [
              {
                name: 'name',
                key: 'key',
                values: ['value1', 'value2'],
              },
            ],
          }
          const group2 = {
            key: 'key2',
            values: [
              {
                name: 'name',
                key: 'key',
                values: ['value1', 'value2'],
              },
            ],
          }
          const result = determineGroupDiffLevel(group1, group2)

          expect(result).toEqual(GroupLevelEnum.AddOrRemove)
        })
      })
      describe('for two dimension group, for sub group key', () => {
        it('should return AddOrRemove level', () => {
          const group1 = {
            key: 'key',
            values: [
              {
                name: 'name',
                key: 'key1',
                values: ['value1', 'value2'],
              },
            ],
          }
          const group2 = {
            key: 'key',
            values: [
              {
                name: 'name',
                key: 'key2',
                values: ['value1', 'value2'],
              },
            ],
          }
          const result = determineGroupDiffLevel(group1, group2)

          expect(result).toEqual(GroupLevelEnum.AddOrRemove)
        })
      })
    })

    describe('when name is different', () => {
      describe('for two dimension group', () => {
        it('should return AddOrRemove level', () => {
          const group1 = {
            key: 'key',
            values: [
              {
                name: 'name1',
                key: 'key',
                values: ['value1', 'value2'],
              },
            ],
          }
          const group2 = {
            key: 'key',
            values: [
              {
                name: 'name2',
                key: 'key',
                values: ['value1', 'value2'],
              },
            ],
          }
          const result = determineGroupDiffLevel(group1, group2)

          expect(result).toEqual(GroupLevelEnum.AddOrRemove)
        })
      })
    })

    describe('when groups do not have the same level', () => {
      describe('for one dimension and two group', () => {
        it('should return StructuralChange level', () => {
          const group1 = {
            key: 'key',
            values: ['value1', 'value2'],
          }
          const group2 = {
            key: 'key',
            values: [
              {
                name: 'name',
                key: 'key',
                values: ['value1', 'value2'],
              },
            ],
          }
          const result = determineGroupDiffLevel(group1, group2)

          expect(result).toEqual(GroupLevelEnum.StructuralChange)
        })
      })
      describe('for two dimension and one dimension group', () => {
        it('should return StructuralChange level', () => {
          const group1 = {
            key: 'key',
            values: [
              {
                name: 'name',
                key: 'key',
                values: ['value1', 'value2'],
              },
            ],
          }
          const group2 = {
            key: 'key',
            values: ['value1', 'value2'],
          }
          const result = determineGroupDiffLevel(group1, group2)

          expect(result).toEqual(GroupLevelEnum.StructuralChange)
        })
      })
    })

    describe('when groups do not have the same level nor have same values', () => {
      describe('for one dimension and two group', () => {
        it('should return StructuralChange level', () => {
          const group1 = {
            key: 'key',
            values: ['value1', 'value2'],
          }
          const group2 = {
            key: 'key',
            values: [
              {
                name: 'name',
                key: 'key',
                values: ['value1', 'value3'],
              },
            ],
          }
          const result = determineGroupDiffLevel(group1, group2)

          expect(result).toEqual(GroupLevelEnum.StructuralChange)
        })
      })
      describe('for two dimension and one dimension group', () => {
        it('should return StructuralChange level', () => {
          const group1 = {
            key: 'key',
            values: [
              {
                name: 'name',
                key: 'key',
                values: ['value1', 'value2'],
              },
            ],
          }
          const group2 = {
            key: 'key',
            values: ['value1', 'value3'],
          }
          const result = determineGroupDiffLevel(group1, group2)

          expect(result).toEqual(GroupLevelEnum.StructuralChange)
        })
      })
    })

    describe('when groups do not have the same shape', () => {
      describe('first group does not exists (add)', () => {
        it('should return StructuralChange level', () => {
          const group1 = '{}'
          const group2 = {
            key: 'key',
            values: [
              {
                name: 'name',
                key: 'key',
                values: ['value1', 'value3'],
              },
            ],
          }
          const result = determineGroupDiffLevel(group1, group2)

          expect(result).toEqual(GroupLevelEnum.StructuralChange)
        })
      })
      describe('second group does not exists (removed)', () => {
        it('should return StructuralChange level', () => {
          const group1 = {
            key: 'key',
            values: [
              {
                name: 'name',
                key: 'key',
                values: ['value1', 'value2'],
              },
            ],
          }
          const group2 = {}
          const result = determineGroupDiffLevel(group1, group2)

          expect(result).toEqual(GroupLevelEnum.StructuralChange)
        })
      })
    })

    describe('when a group is empty string (remove during edit case)', () => {
      describe('first group does not exists (add)', () => {
        it('should return StructuralChange level', () => {
          const group1 = ''
          const group2 = {
            key: 'key',
            values: [
              {
                name: 'name',
                key: 'key',
                values: ['value1', 'value3'],
              },
            ],
          }
          const result = determineGroupDiffLevel(group1, group2)

          expect(result).toEqual(GroupLevelEnum.StructuralChange)
        })
      })
      describe('second group does not exists (removed)', () => {
        it('should return StructuralChange level', () => {
          const group1 = {
            key: 'key',
            values: [
              {
                name: 'name',
                key: 'key',
                values: ['value1', 'value2'],
              },
            ],
          }
          const group2 = ''
          const result = determineGroupDiffLevel(group1, group2)

          expect(result).toEqual(GroupLevelEnum.StructuralChange)
        })
      })
    })
  })
})
