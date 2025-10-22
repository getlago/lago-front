import { gql } from '@apollo/client'
import { Icon } from 'lago-design-system'
import { DateTime } from 'luxon'
import { useEffect, useRef, useState } from 'react'
import { generatePath, useLocation } from 'react-router-dom'

import { ActionItem, Button, Skeleton, Table, Tooltip, Typography } from '~/components/designSystem'
import {
  DeleteApiKeyDialog,
  DeleteApiKeyDialogRef,
} from '~/components/developers/apiKeys/DeleteApiKeyDialog'
import {
  RotateApiKeyDialog,
  RotateApiKeyDialogRef,
} from '~/components/developers/apiKeys/RotateApiKeyDialog'
import {
  SettingsListItem,
  SettingsListItemHeader,
  SettingsListItemLoadingSkeleton,
  SettingsListWrapper,
  SettingsPageHeaderContainer,
} from '~/components/layouts/Settings'
import { PremiumWarningDialog, PremiumWarningDialogRef } from '~/components/PremiumWarningDialog'
import { addToast } from '~/core/apolloClient'
import { obfuscateValue } from '~/core/formats/obfuscate'
import { CREATE_API_KEYS_ROUTE, UPDATE_API_KEYS_ROUTE } from '~/core/router'
import { copyToClipboard } from '~/core/utils/copyToClipboard'
import {
  ApiKeyForDeleteApiKeyDialogFragmentDoc,
  ApiKeyForRotateApiKeyDialogFragmentDoc,
  GetOrganizationInfosForApiKeyQuery,
  useGetApiKeysQuery,
  useGetApiKeyValueLazyQuery,
  useGetOrganizationInfosForApiKeyQuery,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCurrentUser } from '~/hooks/useCurrentUser'
import { useDeveloperTool } from '~/hooks/useDeveloperTool'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { usePermissions } from '~/hooks/usePermissions'
import { STATE_KEY_ID_TO_REVEAL } from '~/pages/developers/ApiKeysForm'
import { tw } from '~/styles/utils'

gql`
  fragment ApiKeyRevealedForApiKeysList on ApiKey {
    id
    value
  }

  query getOrganizationInfosForApiKey {
    organization {
      id
      name
      createdAt
    }
  }

  query getApiKeys($page: Int, $limit: Int) {
    apiKeys(page: $page, limit: $limit) {
      collection {
        id
        createdAt
        expiresAt
        lastUsedAt
        name
        value
        ...ApiKeyForRotateApiKeyDialog
        ...ApiKeyForDeleteApiKeyDialog
      }
      metadata {
        currentPage
        totalPages
        totalCount
      }
    }
  }

  query getApiKeyValue($id: ID!) {
    apiKey(id: $id) {
      id
      ...ApiKeyRevealedForApiKeysList
    }
  }

  ${ApiKeyForRotateApiKeyDialogFragmentDoc}
  ${ApiKeyForDeleteApiKeyDialogFragmentDoc}
`

export const ApiKeys = () => {
  const { hasPermissions } = usePermissions()
  const { isPremium } = useCurrentUser()
  const { state } = useLocation()
  const { translate } = useInternationalization()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()
  const { closePanel: close } = useDeveloperTool()

  const rotateApiKeyDialogRef = useRef<RotateApiKeyDialogRef>(null)
  const deleteApiKeyDialogRef = useRef<DeleteApiKeyDialogRef>(null)
  const premiumWarningDialogRef = useRef<PremiumWarningDialogRef>(null)
  const [showOrganizationId, setShowOrganizationId] = useState(false)
  const [shownApiKeysMap, setShownApiKeysMap] = useState<Map<string, string>>(new Map())

  const { data: organizationData, loading: organizationLoading } =
    useGetOrganizationInfosForApiKeyQuery()
  const { data: apiKeysData, loading: apiKeysLoading } = useGetApiKeysQuery({
    variables: { page: 1, limit: 20 },
    notifyOnNetworkStatusChange: true,
  })
  const [getApiKeyValue, { loading: revealKeyLoading }] = useGetApiKeyValueLazyQuery({
    fetchPolicy: 'network-only',
    notifyOnNetworkStatusChange: true,
  })

  const showPremiumAddApiKeyState = !isPremium && !!apiKeysData?.apiKeys.collection.length

  useEffect(() => {
    const revealGivenKey = async () => {
      const res = await getApiKeyValue({ variables: { id: state[STATE_KEY_ID_TO_REVEAL] } })

      if (!!res?.data?.apiKey?.value) {
        setShownApiKeysMap(
          (prev) => new Map(prev.set(state[STATE_KEY_ID_TO_REVEAL], res.data?.apiKey.value || '')),
        )

        // Remove the keyIdToReveal from the state
        window.history.replaceState({}, '')
      }
    }

    // Incase we're redirected here with a keyIdToReveal, trigger the query
    if (!!state?.[STATE_KEY_ID_TO_REVEAL]) {
      revealGivenKey()
    }
  }, [getApiKeyValue, state])

  return (
    <>
      <div className="flex flex-col gap-12 p-4">
        <SettingsPageHeaderContainer>
          <Typography variant="headline">{translate('text_637f813d31381b1ed90ab2f6')}</Typography>
          <Typography variant="body" color="grey600">
            {translate('text_637f813d31381b1ed90ab300')}
          </Typography>
        </SettingsPageHeaderContainer>

        <SettingsListWrapper>
          {organizationLoading && apiKeysLoading ? (
            <SettingsListItemLoadingSkeleton count={2} />
          ) : (
            <>
              <SettingsListItem className="pb-0 [box-shadow:none]">
                <SettingsListItemHeader
                  label={translate('text_636df520279a9e1b3c68cc75')}
                  sublabel={translate('text_637f813d31381b1ed90ab332')}
                />

                <Table
                  tableInDialog
                  name="organization-id"
                  isLoading={organizationLoading}
                  containerSize={{ default: 0 }}
                  rowSize={48}
                  data={!!organizationData?.organization ? [organizationData?.organization] : []}
                  columns={[
                    {
                      key: 'name',
                      title: translate('text_6419c64eace749372fc72b0f'),
                      minWidth: 147,
                      content: () => (
                        <Typography color="grey700" variant="body">
                          {translate('text_636df520279a9e1b3c68cc75')}
                        </Typography>
                      ),
                    },
                    {
                      key: 'id',
                      title: translate('text_1731079786592ksaixhj9ir9'),
                      maxSpace: true,
                      content: ({ id }) => (
                        <div className="flex items-center gap-2 py-3">
                          <Tooltip
                            placement="top-start"
                            title={translate('text_623b42ff8ee4e000ba87d0c6')}
                            disableHoverListener={!showOrganizationId}
                          >
                            <Typography
                              className={tw('line-break-auto [text-wrap:auto]', {
                                'cursor-pointer': showOrganizationId,
                              })}
                              color="grey700"
                              variant="captionCode"
                              onClick={
                                showOrganizationId
                                  ? () => {
                                      copyToClipboard(id)
                                      addToast({
                                        severity: 'info',
                                        translateKey: 'text_636df520279a9e1b3c68cc7d',
                                      })
                                    }
                                  : undefined
                              }
                            >
                              {showOrganizationId ? id : obfuscateValue(id)}
                            </Typography>
                          </Tooltip>

                          <Tooltip
                            placement="top-start"
                            title={
                              showOrganizationId
                                ? translate('text_1731082143943pr83kgzeh86')
                                : translate('text_1731082129536sv17ey4g0sk')
                            }
                          >
                            <Button
                              variant="quaternary"
                              size="small"
                              icon={showOrganizationId ? 'eye-hidden' : 'eye'}
                              onClick={() => setShowOrganizationId((prev) => !prev)}
                            />
                          </Tooltip>
                        </div>
                      ),
                    },
                    {
                      key: 'createdAt',
                      title: translate('text_1731080136186pvllfpt35on'),
                      minWidth: 138,
                      content: ({ createdAt }) => (
                        <Typography color="grey700" variant="body">
                          {intlFormatDateTimeOrgaTZ(createdAt).date}
                        </Typography>
                      ),
                    },
                  ]}
                  actionColumnTooltip={() => translate('text_646e2d0cc536351b62ba6f01')}
                  actionColumn={({ id }) => {
                    return [
                      {
                        startIcon: showOrganizationId ? 'eye-hidden' : 'eye',
                        title: showOrganizationId
                          ? translate('text_17315173338046klcjqv6wx9')
                          : translate('text_1731517333804u5gdtt01wu1'),
                        onAction: () => {
                          setShowOrganizationId((prev) => !prev)
                        },
                      },
                      showOrganizationId
                        ? {
                            startIcon: 'duplicate',
                            title: translate('text_637f813d31381b1ed90ab326'),
                            onAction: () => {
                              copyToClipboard(id)
                              addToast({
                                severity: 'info',
                                translateKey: 'text_636df520279a9e1b3c68cc7d',
                              })
                            },
                          }
                        : null,
                    ] as ActionItem<GetOrganizationInfosForApiKeyQuery['organization']>[]
                  }}
                />
              </SettingsListItem>

              <SettingsListItem>
                <SettingsListItemHeader
                  label={translate('text_637f813d31381b1ed90ab313')}
                  sublabel={translate('text_637f813d31381b1ed90ab320')}
                  action={
                    hasPermissions(['developersKeysManage']) ? (
                      <Button
                        variant="inline"
                        startIcon="plus"
                        endIcon={showPremiumAddApiKeyState ? 'sparkles' : undefined}
                        onClick={() => {
                          if (showPremiumAddApiKeyState) {
                            premiumWarningDialogRef.current?.openDialog()
                          } else {
                            close()

                            // This route exists in the BrowserRouter and we're currently in MemoryRouter so we need to hard reload the page
                            window.location.href = CREATE_API_KEYS_ROUTE
                          }
                        }}
                      >
                        {translate('text_1732286530467q437l0kqrwg')}
                      </Button>
                    ) : undefined
                  }
                />

                <Table
                  tableInDialog
                  name="api-keys"
                  isLoading={apiKeysLoading}
                  containerSize={{ default: 0 }}
                  rowSize={48}
                  data={apiKeysData?.apiKeys.collection || []}
                  columns={[
                    {
                      key: 'id',
                      title: translate('text_6419c64eace749372fc72b0f'),
                      minWidth: 88,
                      content: ({ name, expiresAt }) => (
                        <Tooltip
                          placement="top-start"
                          title={translate('text_1732182455718np5v78j6dro', {
                            date: DateTime.fromISO(expiresAt)
                              .setLocale('en')
                              .toLocaleString({ ...DateTime.DATETIME_FULL, second: 'numeric' }),
                          })}
                          disableHoverListener={!expiresAt}
                        >
                          <div className="flex items-center gap-2">
                            <Typography color="grey700" variant="body" noWrap>
                              {name || '-'}
                            </Typography>

                            {!!expiresAt && (
                              <Icon name="warning-filled" color="error" size="medium" />
                            )}
                          </div>
                        </Tooltip>
                      ),
                    },
                    {
                      key: 'value',
                      title: translate('text_1731079786592ksaixhj9ir9'),
                      maxSpace: true,
                      content: ({ id, value }) => {
                        const apiKeyValue = shownApiKeysMap.get(id)

                        if (revealKeyLoading) {
                          return <Skeleton variant="text" textVariant="body" className="w-40" />
                        }

                        return (
                          <div className="flex items-center gap-2 py-3">
                            <Tooltip
                              placement="top-start"
                              title={translate('text_623b42ff8ee4e000ba87d0c6')}
                              disableHoverListener={!apiKeyValue}
                            >
                              <Typography
                                className={tw('line-break-auto [text-wrap:auto]', {
                                  'cursor-pointer': !!apiKeyValue,
                                })}
                                color="grey700"
                                variant="captionCode"
                                onClick={
                                  !!apiKeyValue
                                    ? () => {
                                        copyToClipboard(apiKeyValue)
                                        addToast({
                                          severity: 'info',
                                          translateKey: 'text_6227a2e847fcd700e9038952',
                                        })
                                      }
                                    : undefined
                                }
                              >
                                {apiKeyValue || value}
                              </Typography>
                            </Tooltip>

                            <Tooltip
                              placement="top-start"
                              title={
                                !!apiKeyValue
                                  ? translate('text_1731082143943pr83kgzeh86')
                                  : translate('text_1731082129536sv17ey4g0sk')
                              }
                            >
                              <Button
                                variant="quaternary"
                                size="small"
                                icon={!!apiKeyValue ? 'eye-hidden' : 'eye'}
                                onClick={async () => {
                                  if (!!apiKeyValue) {
                                    setShownApiKeysMap((prev) => {
                                      const newMap = new Map(prev)

                                      newMap.delete(id)
                                      return newMap
                                    })
                                  } else {
                                    try {
                                      const res = await getApiKeyValue({ variables: { id } })

                                      if (!!res?.data?.apiKey?.value) {
                                        setShownApiKeysMap(
                                          (prev) =>
                                            new Map(prev.set(id, res.data?.apiKey.value || '')),
                                        )
                                      }
                                    } catch {
                                      addToast({
                                        severity: 'danger',
                                        translateKey: 'text_62b31e1f6a5b8b1b745ece48',
                                      })
                                    }
                                  }
                                }}
                              />
                            </Tooltip>
                          </div>
                        )
                      },
                    },
                    {
                      key: 'lastUsedAt',
                      title: translate('text_1731515447290xbe4iqm5n6r'),
                      minWidth: 140,
                      content: ({ lastUsedAt }) => (
                        <Typography color="grey700" variant="body">
                          {!!lastUsedAt ? intlFormatDateTimeOrgaTZ(lastUsedAt).date : '-'}
                        </Typography>
                      ),
                    },
                    {
                      key: 'createdAt',
                      title: translate('text_1731080136186pvllfpt35on'),
                      minWidth: 140,
                      content: ({ createdAt }) => (
                        <Typography color="grey700" variant="body">
                          {intlFormatDateTimeOrgaTZ(createdAt).date}
                        </Typography>
                      ),
                    },
                  ]}
                  actionColumnTooltip={() => translate('text_646e2d0cc536351b62ba6f01')}
                  actionColumn={(item) => {
                    const id = item.id
                    const apiKeyValue = shownApiKeysMap.get(id)

                    return [
                      {
                        startIcon: !!apiKeyValue ? 'eye-hidden' : 'eye',
                        disabled: apiKeysLoading,
                        title: !!apiKeyValue
                          ? translate('text_1731085297554jks9n068fpp')
                          : translate('text_1731085297554lu61x8djvcr'),
                        onAction: async () => {
                          if (!!apiKeyValue) {
                            setShownApiKeysMap((prev) => {
                              const newMap = new Map(prev)

                              newMap.delete(id)
                              return newMap
                            })
                          } else {
                            try {
                              const res = await getApiKeyValue({ variables: { id } })

                              if (!!res?.data?.apiKey?.value) {
                                setShownApiKeysMap(
                                  (prev) => new Map(prev.set(id, res.data?.apiKey.value || '')),
                                )
                              }
                            } catch {
                              addToast({
                                severity: 'danger',
                                translateKey: 'text_62b31e1f6a5b8b1b745ece48',
                              })
                            }
                          }
                        },
                      },

                      apiKeyValue
                        ? {
                            startIcon: 'duplicate',
                            disabled: apiKeysLoading,
                            title: translate('text_637f813d31381b1ed90ab30a'),
                            onAction: () => {
                              copyToClipboard(apiKeyValue)
                              addToast({
                                severity: 'info',
                                translateKey: 'text_6227a2e847fcd700e9038952',
                              })
                            },
                          }
                        : null,

                      {
                        startIcon: 'pivot',
                        disabled: apiKeysLoading,
                        title: translate('text_17315063604211fznu9haor8'),
                        onAction: () => {
                          rotateApiKeyDialogRef.current?.openDialog({
                            apiKey: item,
                            callBack: (itemToReveal) => {
                              setShownApiKeysMap(
                                (prev) => new Map(prev.set(itemToReveal.id, itemToReveal.value)),
                              )
                            },
                          })
                        },
                      },

                      {
                        startIcon: 'pen',
                        disabled: apiKeysLoading,
                        title: translate('text_1732286530467nu5f8jeg0ov'),
                        onAction: () => {
                          const path = generatePath(UPDATE_API_KEYS_ROUTE, { apiKeyId: id })

                          // This route exists in the BrowserRouter and we're currently in MemoryRouter so we need to hard reload the page
                          window.location.href = path
                        },
                      },

                      (apiKeysData?.apiKeys.collection || []).length > 1
                        ? {
                            startIcon: 'trash',
                            disabled: apiKeysLoading,
                            title: translate('text_17322865304679l26k2dpiw2'),
                            onAction: () => {
                              deleteApiKeyDialogRef.current?.openDialog({ apiKey: item })
                            },
                          }
                        : null,
                    ]
                  }}
                />
              </SettingsListItem>
            </>
          )}
        </SettingsListWrapper>
      </div>

      <PremiumWarningDialog ref={premiumWarningDialogRef} />
      <RotateApiKeyDialog
        ref={rotateApiKeyDialogRef}
        openPremiumDialog={() => premiumWarningDialogRef.current?.openDialog()}
      />
      <DeleteApiKeyDialog ref={deleteApiKeyDialogRef} />
    </>
  )
}
