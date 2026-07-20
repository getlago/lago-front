import { ComponentProps, ReactNode } from 'react'

import { Button } from '~/components/designSystem/Button'
import { StatusType } from '~/components/designSystem/Status'
import { IntegrationsPage } from '~/components/layouts/Integrations'
import { MainHeader } from '~/components/MainHeader/MainHeader'
import { AUTHENTICATION_ROUTE, useNavigate } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'

export type SSOAuthenticationDetailsRow = {
  icon: ComponentProps<typeof IntegrationsPage.DetailsItem>['icon']
  labelKey: string
  value: ComponentProps<typeof IntegrationsPage.DetailsItem>['value']
}

export type SSOAuthenticationDetailsProps<TIntegration extends { id: string }> = {
  integration: TIntegration | null | undefined
  loading: boolean
  refetch: () => void
  hasOtherAuthenticationMethods: boolean
  icon: ReactNode
  viewNameKey: string
  metadataKey: string
  deleteMenuLabelKey: string
  getDetailRows: (integration: TIntegration) => SSOAuthenticationDetailsRow[]
  openAddDialog: (data: {
    integration: TIntegration
    callback: () => void
    deleteCallback: () => void
  }) => void
  openDeleteDialog: (data: { integration: TIntegration; callback: () => void }) => void
}

export const SSOAuthenticationDetails = <TIntegration extends { id: string }>({
  integration,
  loading,
  refetch,
  hasOtherAuthenticationMethods,
  icon,
  viewNameKey,
  metadataKey,
  deleteMenuLabelKey,
  getDetailRows,
  openAddDialog,
  openDeleteDialog,
}: SSOAuthenticationDetailsProps<TIntegration>) => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()

  const onDeleteCallback = () => {
    navigate(AUTHENTICATION_ROUTE)
  }

  const onEditCallback = () => {
    refetch()
  }

  if (!integration) {
    navigate(AUTHENTICATION_ROUTE)
    return null
  }

  const openEditDialog = () =>
    openAddDialog({
      integration,
      callback: onEditCallback,
      deleteCallback: onDeleteCallback,
    })

  return (
    <>
      <MainHeader.Configure
        breadcrumb={[
          {
            label: translate('text_664c732c264d7eed1c74fd96'),
            path: AUTHENTICATION_ROUTE,
          },
        ]}
        entity={{
          viewName: translate(viewNameKey),
          viewNameLoading: loading,
          metadata: translate(metadataKey),
          metadataLoading: loading,
          icon,
          badges: [
            {
              label: translate('text_62b1edddbf5f461ab971270d'),
              type: StatusType.default,
            },
          ],
        }}
        actions={{
          items: [
            {
              type: 'dropdown',
              label: translate('text_626162c62f790600f850b6fe'),
              items: [
                {
                  label: translate('text_664c732c264d7eed1c74fdaa'),
                  onClick: (closePopper) => {
                    closePopper()
                    openEditDialog()
                  },
                },
                {
                  label: translate(deleteMenuLabelKey),
                  onClick: (closePopper) => {
                    closePopper()
                    openDeleteDialog({
                      integration,
                      callback: onDeleteCallback,
                    })
                  },
                  disabled: !hasOtherAuthenticationMethods,
                },
              ],
            },
          ],
          loading,
        }}
      />

      <IntegrationsPage.Container>
        <section>
          <IntegrationsPage.Headline label={translate('text_664c732c264d7eed1c74fdc5')}>
            <Button variant="inline" disabled={loading} onClick={openEditDialog}>
              {translate('text_62b1edddbf5f461ab9712787')}
            </Button>
          </IntegrationsPage.Headline>

          {loading ? (
            [0, 1, 2, 3].map((i) => (
              <IntegrationsPage.ItemSkeleton key={`item-skeleton-item-${i}`} />
            ))
          ) : (
            <>
              {getDetailRows(integration).map((row) => (
                <IntegrationsPage.DetailsItem
                  key={`sso-details-item-${row.labelKey}`}
                  icon={row.icon}
                  label={translate(row.labelKey)}
                  value={row.value}
                />
              ))}
            </>
          )}
        </section>
      </IntegrationsPage.Container>
    </>
  )
}
