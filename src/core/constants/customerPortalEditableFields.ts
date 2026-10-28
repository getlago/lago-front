import { CustomerPortalFieldEnum, UpdateCustomerPortalCustomerInput } from '~/generated/graphql'

// Ordered as they appear in the customer portal form
export const CUSTOMER_PORTAL_FIELDS: {
  field: CustomerPortalFieldEnum
  inputKey: keyof UpdateCustomerPortalCustomerInput
  labelKey: string
}[] = [
  {
    field: CustomerPortalFieldEnum.CustomerType,
    inputKey: 'customerType',
    labelKey: 'text_1726128938631ioz4orixel3',
  },
  {
    field: CustomerPortalFieldEnum.Name,
    inputKey: 'name',
    labelKey: 'text_634687079be251fdb43833cb',
  },
  {
    field: CustomerPortalFieldEnum.Firstname,
    inputKey: 'firstname',
    labelKey: 'text_1726128938631ggtf2ggqs4b',
  },
  {
    field: CustomerPortalFieldEnum.Lastname,
    inputKey: 'lastname',
    labelKey: 'text_1726128938631ymctg83bygm',
  },
  {
    field: CustomerPortalFieldEnum.LegalName,
    inputKey: 'legalName',
    labelKey: 'text_626c0c09812bbc00e4c59e01',
  },
  {
    field: CustomerPortalFieldEnum.TaxIdentificationNumber,
    inputKey: 'taxIdentificationNumber',
    labelKey: 'text_648053ee819b60364c675d05',
  },
  {
    field: CustomerPortalFieldEnum.Email,
    inputKey: 'email',
    labelKey: 'text_626c0c09812bbc00e4c59e09',
  },
  {
    field: CustomerPortalFieldEnum.DocumentLocale,
    inputKey: 'documentLocale',
    labelKey: 'text_63e51ef4985f0ebd75c212fd',
  },
  {
    field: CustomerPortalFieldEnum.AddressLine1,
    inputKey: 'addressLine1',
    labelKey: 'text_62ab2d0396dd6b0361614d78',
  },
  {
    field: CustomerPortalFieldEnum.AddressLine2,
    inputKey: 'addressLine2',
    labelKey: 'text_62ab2d0396dd6b0361614d80',
  },
  {
    field: CustomerPortalFieldEnum.Zipcode,
    inputKey: 'zipcode',
    labelKey: 'text_62ab2d0396dd6b0361614d88',
  },
  {
    field: CustomerPortalFieldEnum.City,
    inputKey: 'city',
    labelKey: 'text_62ab2d0396dd6b0361614d90',
  },
  {
    field: CustomerPortalFieldEnum.State,
    inputKey: 'state',
    labelKey: 'text_62ab2d0396dd6b0361614d98',
  },
  {
    field: CustomerPortalFieldEnum.Country,
    inputKey: 'country',
    labelKey: 'text_62ab2d0396dd6b0361614da0',
  },
  {
    field: CustomerPortalFieldEnum.ShippingAddress,
    inputKey: 'shippingAddress',
    labelKey: 'text_667d708c1359b49f5a5a822a',
  },
]

// Document locale has no input in the customer portal form, so the portal and the settings only deal with the others
export const CUSTOMER_PORTAL_FORM_FIELDS = CUSTOMER_PORTAL_FIELDS.filter(
  ({ field }) => field !== CustomerPortalFieldEnum.DocumentLocale,
)

// The organization stores the locked fields; the portal and the settings work with the editable ones.
// Without a loaded list, nothing is treated as editable.
export const getCustomerPortalEditableFields = (
  lockedFields?: CustomerPortalFieldEnum[] | null,
): CustomerPortalFieldEnum[] =>
  lockedFields
    ? Object.values(CustomerPortalFieldEnum).filter((field) => !lockedFields.includes(field))
    : []

// Only the form fields are decided from the editable list. Any other locked value (document locale, or a field
// the API added after this front end was built) keeps its current lock, so saving never unlocks it by omission.
export const getCustomerPortalLockedFields = (
  editableFields: CustomerPortalFieldEnum[],
  currentLockedFields: CustomerPortalFieldEnum[] = [],
): CustomerPortalFieldEnum[] => {
  const formFields = CUSTOMER_PORTAL_FORM_FIELDS.map(({ field }) => field)

  return [
    ...currentLockedFields.filter((field) => !formFields.includes(field)),
    ...formFields.filter((field) => !editableFields.includes(field)),
  ]
}

export const hasEditableCustomerPortalFormField = (
  editableFields: CustomerPortalFieldEnum[],
): boolean => CUSTOMER_PORTAL_FORM_FIELDS.some(({ field }) => editableFields.includes(field))

// The API refuses a change to a locked field, so only send the editable ones
export const pickCustomerPortalEditableFields = (
  input: UpdateCustomerPortalCustomerInput,
  editableFields: CustomerPortalFieldEnum[],
): UpdateCustomerPortalCustomerInput => {
  const editableInputKeys = CUSTOMER_PORTAL_FIELDS.filter(({ field }) =>
    editableFields.includes(field),
  ).map(({ inputKey }) => inputKey)

  return Object.fromEntries(
    Object.entries(input).filter(([key]) =>
      editableInputKeys.includes(key as keyof UpdateCustomerPortalCustomerInput),
    ),
  )
}
