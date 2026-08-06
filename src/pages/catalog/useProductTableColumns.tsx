import { Chip } from '~/components/designSystem/Chip'
import { TableColumn } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { TypographyWithCopy } from '~/components/designSystem/TypographyWithCopy'
import { ProductForListFragment, ProductTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

export const PRODUCT_ITEM_TYPE_TRANSLATION_KEY: Record<ProductTypeEnum, string> = {
  [ProductTypeEnum.Fixed]: 'text_1783980718113ritmy7z94je',
  [ProductTypeEnum.Usage]: 'text_17839807181133l3z83156s6',
}

// Shared between the full product-items list and the product-details preview:
// the preview drops the "Attached productCategory" column since it is already scoped to
// a single productCategory.
export const useProductTableColumns = ({
  withAttachedProductCategory,
}: {
  withAttachedProductCategory: boolean
}): Array<TableColumn<ProductForListFragment> | null> => {
  const { translate } = useInternationalization()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()

  const columns: Array<TableColumn<ProductForListFragment> | null> = [
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
    withAttachedProductCategory
      ? {
          key: 'productCategory.name',
          title: translate('text_17839807181143h6kt2bdiyi'),
          minWidth: 160,
          content: ({ productCategory }) => (
            <Typography color="grey600" variant="body" noWrap>
              {productCategory?.name || '-'}
            </Typography>
          ),
        }
      : null,
    {
      key: 'filtersCount',
      title: translate('text_1783980718114wkor6aysepe'),
      textAlign: 'right',
      minWidth: 112,
      content: ({ filtersCount }) => (
        <Typography color="grey600" variant="body" noWrap>
          {filtersCount}
        </Typography>
      ),
    },
    {
      key: 'productType',
      title: translate('text_1783980718113na6t9imp2k0'),
      minWidth: 112,
      content: ({ productType }) => (
        <Chip size="small" label={translate(PRODUCT_ITEM_TYPE_TRANSLATION_KEY[productType])} />
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

  return columns
}
