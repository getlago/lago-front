import {
  computeCustomerInitials,
  computeCustomerName,
  getInitials,
} from '~/components/customers/utils'

describe('customerUtils', () => {
  describe('getInitials', () => {
    describe('one word', () => {
      it('should return the first letter of the single word', () => {
        expect(getInitials('First')).toEqual('F')
      })
    })

    describe('multiple words', () => {
      it('should return the first letter of the two words', () => {
        expect(getInitials('First Second')).toEqual('FS')
      })

      it('should return the first letter of all the words', () => {
        expect(getInitials('First Second Third')).toEqual('FST')
      })
    })
  })

  describe('computeCustomerInitials', () => {
    describe('name', () => {
      it('should return the initial of the name', () => {
        expect(computeCustomerInitials({ name: 'Lago' })).toEqual('L')
      })
    })

    describe('name + firstname', () => {
      it('should return the initial of the name', () => {
        expect(computeCustomerInitials({ name: 'Lago', firstname: 'Stefan' })).toEqual('L')
      })
    })

    describe('name + lastname', () => {
      it('should return the initial of the name', () => {
        expect(computeCustomerInitials({ name: 'Lago', lastname: 'World' })).toEqual('L')
      })
    })

    describe('name + firstname + lastname', () => {
      it('should return the initial of the name', () => {
        expect(
          computeCustomerInitials({ name: 'Lago', firstname: 'Stefan', lastname: 'World' }),
        ).toEqual('L')
      })
    })

    describe('firstname', () => {
      it('should return the initial of the firstname', () => {
        expect(computeCustomerInitials({ firstname: 'Stefan' })).toEqual('S')
      })
    })

    describe('firstname + lastname', () => {
      it('should return the initial of both names', () => {
        expect(computeCustomerInitials({ firstname: 'Stefan', lastname: 'World' })).toEqual('SW')
      })
    })

    describe('lastname', () => {
      it('should return the initial of the last name', () => {
        expect(computeCustomerInitials({ lastname: 'World' })).toEqual('W')
      })
    })
  })

  describe('computeCustomerName', () => {
    describe('name', () => {
      it('should return "name"', () => {
        expect(computeCustomerName({ name: 'Lago' })).toEqual('Lago')
      })
    })

    describe('name + firstname', () => {
      it('should return the "name - firstname"', () => {
        expect(computeCustomerName({ name: 'Lago', firstname: 'Stefan' })).toEqual('Lago - Stefan')
      })
    })

    describe('name + lastname', () => {
      it('should return the "name - lastname"', () => {
        expect(computeCustomerName({ name: 'Lago', lastname: 'World' })).toEqual('Lago - World')
      })
    })

    describe('name + firstname + lastname', () => {
      it('should return "name - firstname lastname"', () => {
        expect(
          computeCustomerName({ name: 'Lago', firstname: 'Stefan', lastname: 'World' }),
        ).toEqual('Lago - Stefan World')
      })
    })

    describe('firstname', () => {
      it('should return "firstname"', () => {
        expect(computeCustomerName({ firstname: 'Stefan' })).toEqual('Stefan')
      })
    })

    describe('firstname + lastname', () => {
      it('should return "firstname lastname"', () => {
        expect(computeCustomerName({ firstname: 'Stefan', lastname: 'World' })).toEqual(
          'Stefan World',
        )
      })
    })

    describe('lastname', () => {
      it('should return "lastname"', () => {
        expect(computeCustomerName({ lastname: 'World' })).toEqual('World')
      })
    })
  })
})
