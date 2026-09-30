import { PrivilegeValueTypeEnum } from '~/generated/graphql'

import { findFirstPrivilegeIndexWithDuplicateCode, firstErroredPrivilegeIndex } from '../utils'

describe('firstErroredPrivilegeIndex', () => {
  it('should return the lowest errored privilege index, whatever the path shape', () => {
    expect(
      firstErroredPrivilegeIndex({
        'privileges[2].code': { message: 'x' },
        'privileges[1].valueType': { message: 'x' },
      }),
    ).toBe(1)
    expect(firstErroredPrivilegeIndex({ 'privileges.3.code': { message: 'x' } })).toBe(3)
  })

  it('should ignore falsy entries and non-privilege fields', () => {
    expect(firstErroredPrivilegeIndex({ code: { message: 'x' } })).toBeUndefined()
    expect(firstErroredPrivilegeIndex({ 'privileges[0].code': undefined })).toBeUndefined()
    expect(firstErroredPrivilegeIndex({})).toBeUndefined()
  })
})

describe('findFirstPrivilegeIndexWithDuplicateCode', () => {
  it('should return the index of the first privilege with a duplicate code', () => {
    const privileges = [
      { code: 'privilege1', config: {}, id: '1', valueType: PrivilegeValueTypeEnum.Boolean },
      { code: 'privilege2', config: {}, id: '2', valueType: PrivilegeValueTypeEnum.String },
      { code: 'privilege1', config: {}, id: '3', valueType: PrivilegeValueTypeEnum.String },
      { code: 'privilege3', config: {}, id: '4', valueType: PrivilegeValueTypeEnum.String },
    ]
    const result1 = findFirstPrivilegeIndexWithDuplicateCode(privileges)

    expect(result1).toBe(2)

    const privileges2 = [
      { code: 'privilege1', config: {}, id: '1', valueType: PrivilegeValueTypeEnum.Boolean },
      { code: 'privilege2', config: {}, id: '2', valueType: PrivilegeValueTypeEnum.String },
      { code: 'privilege3', config: {}, id: '3', valueType: PrivilegeValueTypeEnum.String },
    ]
    const result2 = findFirstPrivilegeIndexWithDuplicateCode(privileges2)

    expect(result2).toBe(-1)
  })
})
