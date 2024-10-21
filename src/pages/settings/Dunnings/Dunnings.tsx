import { gql } from '@apollo/client'
import { useRef } from 'react'

import {
  Avatar,
  ButtonLink,
  Chip,
  Icon,
  InfiniteScroll,
  Table,
  Typography,
} from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { PageBannerHeader } from '~/components/layouts/Pages'
import {
  SettingsListItem,
  SettingsListItemHeader,
  SettingsListItemLoadingSkeleton,
  SettingsListWrapper,
  SettingsPaddedContainer,
  SettingsPageHeaderContainer,
} from '~/components/layouts/Settings'
import {
  DefaultCampaignDialog,
  DefaultCampaignDialogRef,
} from '~/components/settings/dunnings/DefaultCampaignDialog'
import { addToast } from '~/core/apolloClient'
import {
  PremiumIntegrationTypeEnum,
  useGetDunningCampaignsQuery,
  useUpdateDunningCampaignStatusMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import ErrorImage from '~/public/images/maneki/error.svg'

gql`
  fragment DunningCampaignItem on DunningCampaign {
    id
    name
    code
    appliedToOrganization
  }

  query getDunningCampaigns($limit: Int, $page: Int) {
    dunningCampaigns(limit: $limit, page: $page, order: "name") {
      metadata {
        currentPage
        totalPages
      }
      collection {
        id
        ...DunningCampaignItem
      }
    }
  }

  mutation updateDunningCampaignStatus($input: UpdateDunningCampaignInput!) {
    updateDunningCampaign(input: $input) {
      id
      appliedToOrganization
    }
  }
`

const Dunnings = () => {
  const { translate } = useInternationalization()
  const defaultCampaignDialogRef = useRef<DefaultCampaignDialogRef>(null)

  const { organization: { premiumIntegrations } = {} } = useOrganizationInfos()

  const { data, loading, error, fetchMore } = useGetDunningCampaignsQuery({
    variables: {
      limit: 20,
    },
  })

  const hasAccessToFeature = premiumIntegrations?.includes(PremiumIntegrationTypeEnum.AutoDunning)

  const [updateStatus] = useUpdateDunningCampaignStatusMutation({
    refetchQueries: ['getDunningCampaigns'],
    onCompleted: ({ updateDunningCampaign }) => {
      if (!updateDunningCampaign) {
        return
      }

      if (updateDunningCampaign.appliedToOrganization) {
        addToast({
          severity: 'success',
          message: translate('text_1728574726495p3lgzy38pah'),
        })
      } else {
        addToast({
          message: translate('text_1728574726495a0wc21wqxnm'),
          severity: 'success',
        })
      }
    },
  })

  if (!!error && !loading) {
    return (
      <GenericPlaceholder
        title={translate('text_629728388c4d2300e2d380d5')}
        subtitle={translate('text_629728388c4d2300e2d380eb')}
        buttonTitle={translate('text_629728388c4d2300e2d38110')}
        buttonVariant="primary"
        buttonAction={() => location.reload()}
        image={<ErrorImage width="136" height="104" />}
      />
    )
  }

  return (
    <>
      <PageBannerHeader>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_17285747264958mqbtws3em8')}
        </Typography>
      </PageBannerHeader>

      <SettingsPaddedContainer>
        <SettingsPageHeaderContainer>
          <Typography variant="headline">{translate('text_17285747264958mqbtws3em8')}</Typography>
          <Typography>{translate('text_1728574726495473mszb2j27')}</Typography>
        </SettingsPageHeaderContainer>

        {!!loading ? (
          <SettingsListItemLoadingSkeleton count={2} />
        ) : (
          <>
            <SettingsListWrapper>
              <SettingsListItem>
                <SettingsListItemHeader
                  label={translate('text_1728574726495w5aylnynne9')}
                  sublabel={translate('text_1728574726495kqlx1l8crvp')}
                />

                {!hasAccessToFeature ? (
                  <div className="flex items-center justify-between gap-4 rounded-lg bg-grey-100 px-6 py-4">
                    <div>
                      <Typography variant="bodyHl" color="textSecondary">
                        {translate('text_1729263759370k8po52j4m2n')} <Icon name="sparkles" />
                      </Typography>
                      <Typography variant="caption">
                        {translate('text_1729263759370rhgayszv6yq')}
                      </Typography>
                    </div>
                    <ButtonLink
                      buttonProps={{
                        variant: 'tertiary',
                        size: 'medium',
                        endIcon: 'sparkles',
                      }}
                      type="button"
                      external
                      to={`mailto:hello@getlago.com?subject=${translate('text_1729263868504ljw2poh51w4')}&body=${translate('text_17292638685046z36ct98v0l')}`}
                    >
                      {translate('text_65ae73ebe3a66bec2b91d72d')}
                    </ButtonLink>
                  </div>
                ) : !data?.dunningCampaigns.collection.length ? (
                  <Typography variant="body" color="grey500">
                    {translate('text_17285860642666dsgcx901iq')}
                  </Typography>
                ) : (
                  <InfiniteScroll
                    onBottom={() => {
                      const { currentPage, totalPages } = data.dunningCampaigns.metadata

                      currentPage < totalPages &&
                        !loading &&
                        fetchMore({
                          variables: {
                            page: currentPage + 1,
                          },
                        })
                    }}
                  >
                    <Table
                      name="dunnings-settings-list"
                      containerSize={{ default: 0 }}
                      rowSize={72}
                      isLoading={loading}
                      data={data.dunningCampaigns.collection}
                      columns={[
                        {
                          key: 'name',
                          title: translate('text_626162c62f790600f850b76a'),
                          maxSpace: true,
                          content: ({ name, code }) => (
                            <div className="flex flex-1 items-center gap-3" data-test={code}>
                              <Avatar size="big" variant="connector">
                                <Icon size="medium" name="coin-dollar" color="dark" />
                              </Avatar>
                              <div>
                                <Typography color="textSecondary" variant="bodyHl" noWrap>
                                  {name}
                                </Typography>
                                <Typography variant="caption" noWrap>
                                  {code}
                                </Typography>
                              </div>
                            </div>
                          ),
                        },
                        {
                          key: 'appliedToOrganization',
                          title: translate('text_63ac86d797f728a87b2f9fa7'),
                          content: ({ appliedToOrganization }) =>
                            appliedToOrganization && (
                              <Chip label={translate('text_65281f686a80b400c8e2f6d1')} />
                            ),
                          minWidth: 96,
                        },
                      ]}
                      actionColumnTooltip={() => translate('text_17285747264959xu1spelnh9')}
                      actionColumn={(campaign) => {
                        return [
                          campaign.appliedToOrganization
                            ? {
                                startIcon: 'star-outlined-hidden',
                                title: translate('text_1728574726495j7n9zqj7o71'),
                                onAction: () => {
                                  defaultCampaignDialogRef.current?.openDialog({
                                    type: 'removeDefault',
                                    onConfirm: () => {
                                      updateStatus({
                                        variables: {
                                          input: {
                                            id: campaign.id,
                                            appliedToOrganization: false,
                                          },
                                        },
                                      })
                                    },
                                  })
                                },
                              }
                            : {
                                startIcon: 'star-filled',
                                title: translate('text_1728574726495n9jdse2hnrf'),
                                onAction: () => {
                                  defaultCampaignDialogRef.current?.openDialog({
                                    type: 'setDefault',
                                    onConfirm: () => {
                                      updateStatus({
                                        variables: {
                                          input: {
                                            id: campaign.id,
                                            appliedToOrganization: true,
                                          },
                                        },
                                      })
                                    },
                                  })
                                },
                              },
                        ]
                      }}
                    />
                  </InfiniteScroll>
                )}
              </SettingsListItem>
            </SettingsListWrapper>
          </>
        )}
      </SettingsPaddedContainer>

      <DefaultCampaignDialog ref={defaultCampaignDialogRef} />
    </>
  )
}

export default Dunnings
