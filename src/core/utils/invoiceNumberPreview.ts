import { DateTime } from 'luxon'

import { DocumentNumberingEnum } from '~/generated/graphql'

export const getInvoiceNumberPreview = (
  documentNumbering: DocumentNumberingEnum,
  documentNumberPrefix: string,
) => {
  const date = DateTime.now().toFormat('yyyyMM')

  const numberEnding = {
    [DocumentNumberingEnum.PerCustomer]: '001-001',
    [DocumentNumberingEnum.PerOrganization]: `${date}-001`,
  }

  return `${documentNumberPrefix}-${numberEnding[documentNumbering]}`
}
