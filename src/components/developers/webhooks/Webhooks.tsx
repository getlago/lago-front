import { gql } from '@apollo/client'
import { useRef, useState } from 'react'
import { generatePath } from 'react-router-dom'

import { Button, Table, Tooltip, Typography } from '~/components/designSystem'
import { WEBHOOK_ROUTE } from '~/components/developers/DevtoolsRouter'
import {
  CreateWebhookDialog,
  CreateWebhookDialogRef,
} from '~/components/developers/webhooks/CreateWebhookDialog'
import {
  DeleteWebhookDialog,
  DeleteWebhookDialogRef,
} from '~/components/developers/webhooks/DeleteWebhookDialog'
import {
  SettingsListItem,
  SettingsListItemHeader,
  SettingsListItemLoadingSkeleton,
} from '~/components/layouts/Settings'
import { addToast } from '~/core/apolloClient'
import { obfuscateValue } from '~/core/formats/obfuscate'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  useGetOrganizationHmacDataQuery,
  useGetWebhookListQuery,
  WebhookForCreateAndEditFragmentDoc,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { tw } from '~/styles/utils'

const WEBHOOK_COUNT_LIMIT = 10

gql`
  query getOrganizationHmacData {
    organization {
      id
      hmacKey
    }
  }

  query getWebhookList($limit: Int) {
    webhookEndpoints(limit: $limit) {
      collection {
        id
        webhookUrl
        ...WebhookForCreateAndEdit
      }
    }
  }

  ${WebhookForCreateAndEditFragmentDoc}
`

export const Webhooks = () => {
  const { translate } = useInternationalization()
  const [showOrganizationHmac, setShowOrganizationHmac] = useState<boolean>(false)
  const createDialogRef = useRef<CreateWebhookDialogRef>(null)
  const deleteDialogRef = useRef<DeleteWebhookDialogRef>(null)
  const { data: organizationData, loading: organizationLoading } = useGetOrganizationHmacDataQuery()
  const { data: webhookData, loading: webhookLoading } = useGetWebhookListQuery({
    variables: { limit: WEBHOOK_COUNT_LIMIT },
  })

  return (
    <>
      <div>
        <div className="p-4 shadow-b">
          <Typography variant="headline">{translate('text_6271200984178801ba8bdef2')}</Typography>
        </div>

        <div className="flex flex-col gap-12 p-4">
          {webhookLoading && organizationLoading ? (
            <SettingsListItemLoadingSkeleton count={2} />
          ) : (
            <>
              <SettingsListItem className="pb-0 [box-shadow:none]">
                <SettingsListItemHeader
                  label={translate('text_6271200984178801ba8bdf40')}
                  sublabel={translate('text_1746190277237kaa03zrbbd9')}
                  action={
                    <Button
                      disabled={
                        (webhookData?.webhookEndpoints.collection || []).length >=
                        WEBHOOK_COUNT_LIMIT
                      }
                      variant="inline"
                      onClick={() => createDialogRef?.current?.openDialog()}
                      startIcon="plus"
                    >
                      {translate('text_1746190277237vdc9v07s2fe')}
                    </Button>
                  }
                />

                {!!webhookData?.webhookEndpoints.collection.length && (
                  <Table
                    tableInDialog
                    name="webhooks-list"
                    isLoading={webhookLoading}
                    containerSize={{ default: 0 }}
                    rowSize={48}
                    data={webhookData?.webhookEndpoints.collection || []}
                    columns={[
                      {
                        key: 'id',
                        title: translate('text_1731675102864qdlsq84v1o8'),
                        maxSpace: true,
                        content: ({ webhookUrl }) => (
                          <Typography color="grey700" variant="body">
                            {webhookUrl}
                          </Typography>
                        ),
                      },
                    ]}
                    onRowActionLink={({ id }) => generatePath(WEBHOOK_ROUTE, { webhookId: id })}
                    actionColumnTooltip={() => translate('text_6256de3bba111e00b3bfa51b')}
                    actionColumn={(webhook) => {
                      return [
                        {
                          startIcon: 'pen',
                          title: translate('text_63aa15caab5b16980b21b0b8'),
                          onAction: () => {
                            createDialogRef?.current?.openDialog(webhook)
                          },
                        },
                        {
                          startIcon: 'trash',
                          title: translate('text_63aa15caab5b16980b21b0ba'),
                          onAction: () => {
                            deleteDialogRef.current?.openDialog(webhook.id)
                          },
                        },
                      ]
                    }}
                  />
                )}
              </SettingsListItem>

              <SettingsListItem>
                <SettingsListItemHeader
                  label={translate('text_1731675102863c4rd5s6gdlw')}
                  sublabel={translate('text_1731675102864bisv94uujh1')}
                />

                <Table
                  tableInDialog
                  name="organization-hmac-key"
                  isLoading={organizationLoading}
                  containerSize={{ default: 0 }}
                  rowSize={48}
                  data={!!organizationData?.organization ? [organizationData?.organization] : []}
                  columns={[
                    {
                      key: 'hmacKey',
                      title: translate('text_1731079786592ksaixhj9ir9'),
                      minWidth: 147,
                      maxSpace: true,
                      content: ({ hmacKey }) => (
                        <div className="flex items-center gap-2 py-3">
                          <Tooltip
                            placement="top-start"
                            title={translate('text_623b42ff8ee4e000ba87d0c6')}
                            disableHoverListener={!showOrganizationHmac}
                          >
                            <Typography
                              className={tw('line-break-auto [text-wrap:auto]', {
                                'cursor-pointer': showOrganizationHmac,
                              })}
                              color="grey700"
                              variant="captionCode"
                              onClick={
                                showOrganizationHmac
                                  ? () => {
                                      copyToClipboard(hmacKey || '')
                                      addToast({
                                        severity: 'info',
                                        translateKey: 'text_1731675102864b4dna9o03pv',
                                      })
                                    }
                                  : undefined
                              }
                            >
                              {showOrganizationHmac ? hmacKey : obfuscateValue(hmacKey || '')}
                            </Typography>
                          </Tooltip>

                          <Tooltip
                            placement="top-start"
                            title={
                              showOrganizationHmac
                                ? translate('text_1731082143943pr83kgzeh86')
                                : translate('text_1731082129536sv17ey4g0sk')
                            }
                          >
                            <Button
                              variant="quaternary"
                              size="small"
                              icon={showOrganizationHmac ? 'eye-hidden' : 'eye'}
                              onClick={() => setShowOrganizationHmac((prev) => !prev)}
                            />
                          </Tooltip>
                        </div>
                      ),
                    },
                  ]}
                  actionColumnTooltip={() => translate('text_646e2d0cc536351b62ba6f01')}
                  actionColumn={({ hmacKey }) => {
                    return [
                      {
                        startIcon: showOrganizationHmac ? 'eye-hidden' : 'eye',
                        title: showOrganizationHmac
                          ? translate('text_1731085297554jks9n068fpp')
                          : translate('text_1731085297554lu61x8djvcr'),
                        onAction: () => {
                          setShowOrganizationHmac((prev) => !prev)
                        },
                      },
                      showOrganizationHmac
                        ? {
                            startIcon: 'duplicate',
                            title: translate('text_637f813d31381b1ed90ab30a'),
                            onAction: () => {
                              copyToClipboard(hmacKey || '')
                              addToast({
                                severity: 'info',
                                translateKey: 'text_1731675102864b4dna9o03pv',
                              })
                            },
                          }
                        : null,
                    ]
                  }}
                />
              </SettingsListItem>
            </>
          )}
        </div>
      </div>

      <CreateWebhookDialog ref={createDialogRef} />
      <DeleteWebhookDialog ref={deleteDialogRef} />
    </>
  )
}
