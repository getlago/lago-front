import {
  CustomerPortalEditableFieldEnum,
  UpdateCustomerPortalCustomerInput,
} from '~/generated/graphql'

// Ordered as they appear in the customer portal form
export const CUSTOMER_PORTAL_EDITABLE_FIELDS: {
  field: CustomerPortalEditableFieldEnum
  inputKey: keyof UpdateCustomerPortalCustomerInput
  labelKey: string
}[] = [
  {
    field: CustomerPortalEditableFieldEnum.CustomerType,
    inputKey: 'customerType',
    labelKey: 'text_1726128938631ioz4orixel3',
  },
  {
    field: CustomerPortalEditableFieldEnum.Name,
    inputKey: 'name',
    labelKey: 'text_634687079be251fdb43833cb',
  },
  {
    field: CustomerPortalEditableFieldEnum.Firstname,
    inputKey: 'firstname',
    labelKey: 'text_1726128938631ggtf2ggqs4b',
  },
  {
    field: CustomerPortalEditableFieldEnum.Lastname,
    inputKey: 'lastname',
    labelKey: 'text_1726128938631ymctg83bygm',
  },
  {
    field: CustomerPortalEditableFieldEnum.LegalName,
    inputKey: 'legalName',
    labelKey: 'text_626c0c09812bbc00e4c59e01',
  },
  {
    field: CustomerPortalEditableFieldEnum.TaxIdentificationNumber,
    inputKey: 'taxIdentificationNumber',
    labelKey: 'text_648053ee819b60364c675d05',
  },
  {
    field: CustomerPortalEditableFieldEnum.Email,
    inputKey: 'email',
    labelKey: 'text_626c0c09812bbc00e4c59e09',
  },
  {
    field: CustomerPortalEditableFieldEnum.DocumentLocale,
    inputKey: 'documentLocale',
    labelKey: 'text_63e51ef4985f0ebd75c212fd',
  },
  {
    field: CustomerPortalEditableFieldEnum.AddressLine1,
    inputKey: 'addressLine1',
    labelKey: 'text_62ab2d0396dd6b0361614d78',
  },
  {
    field: CustomerPortalEditableFieldEnum.AddressLine2,
    inputKey: 'addressLine2',
    labelKey: 'text_62ab2d0396dd6b0361614d80',
  },
  {
    field: CustomerPortalEditableFieldEnum.Zipcode,
    inputKey: 'zipcode',
    labelKey: 'text_62ab2d0396dd6b0361614d88',
  },
  {
    field: CustomerPortalEditableFieldEnum.City,
    inputKey: 'city',
    labelKey: 'text_62ab2d0396dd6b0361614d90',
  },
  {
    field: CustomerPortalEditableFieldEnum.State,
    inputKey: 'state',
    labelKey: 'text_62ab2d0396dd6b0361614d98',
  },
  {
    field: CustomerPortalEditableFieldEnum.Country,
    inputKey: 'country',
    labelKey: 'text_62ab2d0396dd6b0361614da0',
  },
  {
    field: CustomerPortalEditableFieldEnum.ShippingAddress,
    inputKey: 'shippingAddress',
    labelKey: 'text_667d708c1359b49f5a5a822a',
  },
]

// Document locale has no input in the customer portal form, so the portal and the settings only deal with the others
export const CUSTOMER_PORTAL_FORM_FIELDS = CUSTOMER_PORTAL_EDITABLE_FIELDS.filter(
  ({ field }) => field !== CustomerPortalEditableFieldEnum.DocumentLocale,
)

export const hasEditableCustomerPortalFormField = (
  editableFields: CustomerPortalEditableFieldEnum[],
): boolean => CUSTOMER_PORTAL_FORM_FIELDS.some(({ field }) => editableFields.includes(field))

// The API refuses any field the organization did not open, so only send the editable ones
export const pickCustomerPortalEditableFields = (
  input: UpdateCustomerPortalCustomerInput,
  editableFields: CustomerPortalEditableFieldEnum[],
): UpdateCustomerPortalCustomerInput => {
  const editableInputKeys = CUSTOMER_PORTAL_EDITABLE_FIELDS.filter(({ field }) =>
    editableFields.includes(field),
  ).map(({ inputKey }) => inputKey)

  return Object.fromEntries(
    Object.entries(input).filter(([key]) =>
      editableInputKeys.includes(key as keyof UpdateCustomerPortalCustomerInput),
    ),
  )
}
