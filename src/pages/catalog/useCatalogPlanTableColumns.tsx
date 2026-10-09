import { gql } from '@apollo/client'

import { TableColumn } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { CatalogPlanForTableColumnsFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

gql`
  fragment CatalogPlanForTableColumns on CatalogPlan {
    id
    name
    code
    invoiceDisplayName
    createdAt
    appliedRateCardsCount
    contractsCount
  }
`

// Shared between the standalone catalog-plans list and the catalog-object detail
// pages' scoped plans tab: both render the identical four columns, each off its own
// query/fragment (every consumer owns its fragment), so only the column shapes - not
// the data fetching - are shared here.
export const useCatalogPlanTableColumns = (): TableColumn<CatalogPlanForTableColumnsFragment>[] => {
  const { translate } = useInternationalization()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()

  return [
    {
      key: 'name',
      title: translate('text_6419c64eace749372fc72b0f'),
      minWidth: 200,
      maxSpace: true,
      content: ({ name, invoiceDisplayName, code }) => (
        <>
          <Typography color="textSecondary" variant="bodyHl" noWrap>
            {invoiceDisplayName || name}
          </Typography>
          <TypographyWithCopy compact noWrap variant="caption">
            {code}
          </TypographyWithCopy>
        </>
      ),
    },
    {
      key: 'appliedRateCardsCount',
      title: translate('text_1789030049528f40pn120tj7'),
      textAlign: 'right',
      minWidth: 112,
      content: ({ appliedRateCardsCount }) => (
        <Typography color="grey600" variant="body" noWrap>
          {appliedRateCardsCount}
        </Typography>
      ),
    },
    {
      key: 'contractsCount',
      title: translate('text_1789030049528f6kajqwypsr'),
      textAlign: 'right',
      minWidth: 130,
      content: ({ contractsCount }) => (
        <Typography color="grey600" variant="body" noWrap>
          {contractsCount}
        </Typography>
      ),
    },
    {
      key: 'createdAt',
      title: translate('text_629728388c4d2300e2d380e3'),
      textAlign: 'right',
      minWidth: 140,
      content: ({ createdAt }) => (
        <Typography color="grey600" variant="body" noWrap>
          {intlFormatDateTimeOrgaTZ(createdAt).date}
        </Typography>
      ),
    },
  ]
}
