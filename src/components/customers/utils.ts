import { Customer, CustomerTypeEnum } from '~/generated/graphql'

export const getInitials = (str: string) =>
  str.split(' ').reduce((acc, n) => (acc = acc + n[0]), '')

export const computeCustomerInitials = (
  customer?: Pick<Customer, 'name' | 'firstname' | 'lastname'> | null,
) => {
  const { name = '', firstname = '', lastname = '' } = customer ?? {}

  if (name) {
    return getInitials(name)
  }

  if (firstname || lastname) {
    return getInitials(`${firstname} ${lastname}`.trim())
  }

  return '-'
}

export const computeCustomerName = (
  customer?: Pick<Customer, 'name' | 'firstname' | 'lastname'> | null,
) => {
  const { name = '', firstname = '', lastname = '' } = customer ?? {}

  if (name && (firstname || lastname)) {
    const fullName = `${firstname} ${lastname}`.trim()

    return `${name} - ${fullName}`
  }

  if (firstname || lastname) {
    return `${firstname} ${lastname}`.trim()
  }

  return name
}

export const TRANSLATIONS_MAP_CUSTOMER_TYPE: Record<CustomerTypeEnum, string> = {
  [CustomerTypeEnum.Individual]: 'text_1726129457108txzr4gdkvcz',
  [CustomerTypeEnum.Company]: 'text_1726129457108raohiy4kkt3',
}
