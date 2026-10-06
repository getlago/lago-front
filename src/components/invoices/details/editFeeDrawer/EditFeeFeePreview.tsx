import { tw } from 'lago-design-system'
import { FC } from 'react'

import { Typography } from '~/components/designSystem/Typography'
import { DrawerLayout } from '~/components/layouts/Drawer'
import { TExtendedRemainingFee } from '~/core/formats/formatInvoiceItemsMap'
import { useInternationalization } from '~/hooks/core/useInternationalization'

import { InvoiceTableSection } from '../InvoiceDetailsTable'
import { InvoiceDetailsTableBodyLine } from '../InvoiceDetailsTableBodyLine'
import { ViewFeeDetailsDrawerProvider } from '../ViewFeeDetailsDrawer'

// InvoiceTableSection always injects one of its 5/6-column layouts; this preview has 4, and
// the section exposes no way to declare them, so every width has to be overridden here.
const PREVIEW_TABLE_CLASSES = tw(
  '[&_table>thead>tr>th:nth-child(1)]:w-[45%] [&_table>thead>tr>th:nth-child(2)]:w-[15%] [&_table>thead>tr>th:nth-child(3)]:w-[20%] [&_table>thead>tr>th:nth-child(4)]:w-[20%]',
  '[&_table>tbody>tr>td:nth-child(1)]:w-[45%] [&_table>tbody>tr>td:nth-child(2)]:w-[15%] [&_table>tbody>tr>td:nth-child(3)]:w-[20%] [&_table>tbody>tr>td:nth-child(4)]:w-[20%]',
  '[&_table>tbody>tr:last-child>td]:pb-0 [&_table>tbody>tr:last-child>td]:shadow-none [&_table>thead>tr>th]:pt-0',
)

type EditFeeFeePreviewProps = {
  fee: TExtendedRemainingFee
  feeName: string
  isRegenerateMode: boolean
}

export const EditFeeFeePreview: FC<EditFeeFeePreviewProps> = ({
  fee,
  feeName,
  isRegenerateMode,
}) => {
  const { translate } = useInternationalization()

  const preview = (
    <DrawerLayout.Section>
      <DrawerLayout.SectionTitle
        title={translate('text_65a6b4e2cb38d9b70ec53c35')}
        description={translate('text_1737556835239q7202lhbdhk')}
      />
      <InvoiceTableSection className={PREVIEW_TABLE_CLASSES}>
        <table>
          <thead>
            <tr>
              {[
                'text_6388b923e514213fed58331c',
                'text_65771fa3f4ab9a00720726ce',
                'text_6453819268763979024ad089',
                'text_634d631acf4dce7b0127a3a6',
              ].map((headerKey) => (
                <th key={headerKey}>
                  <Typography variant="captionHl" color="grey600">
                    {translate(headerKey)}
                  </Typography>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            <InvoiceDetailsTableBodyLine
              canHaveUnitPrice
              hideVat
              currency={fee.currency}
              displayName={feeName}
              fee={fee}
              isDraftInvoice={false}
            />
          </tbody>
        </table>
      </InvoiceTableSection>
    </DrawerLayout.Section>
  )

  // NiceModal mounts the drawer body at the app root, outside the page's provider; the
  // regenerate flow has none by design, so its preview row must not open the details drawer.
  if (isRegenerateMode) return preview

  return <ViewFeeDetailsDrawerProvider>{preview}</ViewFeeDetailsDrawerProvider>
}
