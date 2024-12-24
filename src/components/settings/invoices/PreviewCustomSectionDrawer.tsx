import { gql } from '@apollo/client'
import { forwardRef, useImperativeHandle, useRef, useState } from 'react'

import { Button, Drawer, DrawerRef, Typography } from '~/components/designSystem'
import {
  CreateInvoiceCustomSectionInput,
  useGetOrganizationCustomFooterForInvoiceLazyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import Logo from '~/public/images/logo/lago-logo-grey.svg'

gql`
  query GetOrganizationCustomFooterForInvoice {
    organization {
      billingConfiguration {
        invoiceFooter
      }
    }
  }
`

type TPreviewCustomSectionDrawerProps = Pick<
  CreateInvoiceCustomSectionInput,
  'displayName' | 'details'
>

export interface PreviewCustomSectionDrawerRef {
  openDrawer: (params: TPreviewCustomSectionDrawerProps) => void
  closeDrawer: () => void
}

export const PreviewCustomSectionDrawer = forwardRef<PreviewCustomSectionDrawerRef>(
  (_props, ref) => {
    const { translate } = useInternationalization()
    const drawerRef = useRef<DrawerRef>(null)
    const [localData, setLocalData] = useState<
      TPreviewCustomSectionDrawerProps & {
        invoiceFooter?: string
      }
    >()

    const [getOrganizationCustomFooter] = useGetOrganizationCustomFooterForInvoiceLazyQuery()

    useImperativeHandle(ref, () => ({
      openDrawer: async (args) => {
        const { data } = await getOrganizationCustomFooter()

        setLocalData({
          ...args,
          invoiceFooter: data?.organization?.billingConfiguration?.invoiceFooter ?? undefined,
        })

        drawerRef.current?.openDrawer()
      },
      closeDrawer: () => drawerRef.current?.closeDrawer(),
    }))

    const hasLocalData = localData?.displayName || localData?.details

    return (
      <Drawer
        ref={drawerRef}
        withPadding={false}
        stickyBottomBar={({ closeDrawer }) => (
          <div className="flex justify-end">
            <Button onClick={closeDrawer}>{translate('text_62f50d26c989ab03196884ae')}</Button>
          </div>
        )}
        title={
          <div className="flex flex-1 flex-row items-center justify-between gap-1">
            <Typography variant="bodyHl" color="textSecondary">
              {translate('text_17326350108761jc0z8eusa8')}
            </Typography>
          </div>
        }
      >
        <div className="h-full bg-grey-100 pb-12 pl-12">
          <div className="flex size-full flex-col justify-end bg-white px-12 py-8">
            {hasLocalData && (
              <div className="flex flex-col gap-1 pb-6 shadow-b">
                {localData?.displayName && (
                  <Typography variant="captionHl" color="textSecondary">
                    {localData.displayName}
                  </Typography>
                )}
                {localData?.details && (
                  <Typography variant="caption">{localData.details}</Typography>
                )}
              </div>
            )}

            <Typography variant="caption" className="py-6">
              {localData?.invoiceFooter}
            </Typography>
            <div className="ml-auto flex flex-row items-center gap-1">
              <Typography className="font-email text-xs font-normal" color="grey500">
                {translate('text_6419c64eace749372fc72b03')}
              </Typography>
              <Logo height="12px" />
            </div>
          </div>
        </div>
      </Drawer>
    )
  },
)

PreviewCustomSectionDrawer.displayName = 'PreviewCustomSectionDrawer'
