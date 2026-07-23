import { Chip } from '~/components/designSystem/Chip'
import { TableColumn } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { ProductItemFilterForListFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

// Shared between the full product-item-filters list and the product-item-details
// preview (Task 11): the preview drops the "Attached product item" column since it
// is already scoped to a single product item (mirrors the product-item columns hook
// dropping its attached-product column via `withAttachedProduct`).
export const useProductItemFilterTableColumns = ({
  withAttachedProductItem,
}: {
  withAttachedProductItem: boolean
}): { columns: Array<TableColumn<ProductItemFilterForListFragment> | null> } => {
  const { translate } = useInternationalization()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()

  const columns: Array<TableColumn<ProductItemFilterForListFragment> | null> = [
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
    withAttachedProductItem
      ? {
          key: 'productItem.name',
          title: translate('text_17845790210805g4buh2kivc'),
          minWidth: 160,
          content: ({ productItem }) => (
            <Chip size="small" label={productItem.invoiceDisplayName || productItem.name} />
          ),
        }
      : null,
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

  return { columns }
}
