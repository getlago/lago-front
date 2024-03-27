import { addValuesToUrlState } from '../urlUtils'

describe('urlUtils', () => {
  describe('addValuesToUrlState', () => {
    it('should create state with value if not existing', () => {
      const url = 'http://localhost:3000'
      const mode = 'login'
      const result = addValuesToUrlState(url, { mode, test: 'value' })

      expect(result).toEqual(
        'http://localhost:3000/?state=%7B%22mode%22%3A%22login%22%2C%22test%22%3A%22value%22%7D',
      )
    })

    it('should add mode to url state', () => {
      const url = 'http://localhost:3000?state={}'
      const mode = 'login'
      const result = addValuesToUrlState(url, { mode, test: 'value' })

      expect(result).toEqual(
        'http://localhost:3000/?state=%7B%22mode%22%3A%22login%22%2C%22test%22%3A%22value%22%7D',
      )
    })

    it('should add happen mode to existing state values', () => {
      const url = 'http://localhost:3000?state={"other":"value"}'
      const mode = 'login'
      const result = addValuesToUrlState(url, { mode, test: 'value' })

      expect(result).toEqual(
        'http://localhost:3000/?state=%7B%22other%22%3A%22value%22%2C%22mode%22%3A%22login%22%2C%22test%22%3A%22value%22%7D',
      )
    })
  })
})
