import { gql } from '@apollo/client'
import { Avatar, Icon } from 'lago-design-system'
import { useMemo, useRef } from 'react'
import { generatePath, useNavigate } from 'react-router-dom'

import { Button, ButtonLink, InfiniteScroll, Table, Typography } from '~/components/designSystem'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { PageBannerHeaderWithBurgerMenu } from '~/components/layouts/CenteredPage'
import {
  SettingsListItem,
  SettingsListItemHeader,
  SettingsListItemLoadingSkeleton,
  SettingsListWrapper,
  SettingsPaddedContainer,
  SettingsPageHeaderContainer,
} from '~/components/layouts/Settings'
import {
  DeleteCampaignDialog,
  DeleteCampaignDialogRef,
} from '~/components/settings/dunnings/DeleteCampaignDialog'
import { CREATE_DUNNING_ROUTE, UPDATE_DUNNING_ROUTE } from '~/core/router'
import {
  DeleteCampaignFragmentDoc,
  PremiumIntegrationTypeEnum,
  useGetDunningCampaignsQuery,
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
        ...DeleteCampaign
      }
    }
  }

  mutation updateDunningCampaignStatus($input: UpdateDunningCampaignInput!) {
    updateDunningCampaign(input: $input) {
      id
      appliedToOrganization
    }
  }

  ${DeleteCampaignFragmentDoc}
`

const Dunnings = () => {
  const { translate } = useInternationalization()
  const navigate = useNavigate()
  const deleteCampaignDialogRef = useRef<DeleteCampaignDialogRef>(null)

  const { organization: { premiumIntegrations } = {} } = useOrganizationInfos()

  const { data, loading, error, fetchMore } = useGetDunningCampaignsQuery({
    variables: {
      limit: 20,
    },
  })

  const hasAccessToFeature = premiumIntegrations?.includes(PremiumIntegrationTypeEnum.AutoDunning)

  const sortedTable = useMemo(
    () =>
      [...(data?.dunningCampaigns.collection ?? [])].sort((a) => {
        // Put items with appliedToOrganization: true first
        return a.appliedToOrganization ? -1 : 1
      }),
    [data?.dunningCampaigns.collection],
  )

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
      <PageBannerHeaderWithBurgerMenu>
        <Typography variant="bodyHl" color="grey700">
          {translate('text_17285747264958mqbtws3em8')}
        </Typography>
      </PageBannerHeaderWithBurgerMenu>

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
                  action={
                    hasAccessToFeature ? (
                      <Button
                        variant="quaternary"
                        disabled={loading}
                        onClick={() => {
                          navigate(CREATE_DUNNING_ROUTE)
                        }}
                        data-test="create-dunning-button"
                      >
                        {translate('text_645bb193927b375079d28ad2')}
                      </Button>
                    ) : undefined
                  }
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
                      data={sortedTable}
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
                      ]}
                      actionColumnTooltip={() => translate('text_17285747264959xu1spelnh9')}
                      actionColumn={(campaign) => {
                        return [
                          {
                            startIcon: 'pen',
                            title: translate('text_17321873136602nzwuvcycbr'),
                            onAction: () => {
                              navigate(
                                generatePath(UPDATE_DUNNING_ROUTE, {
                                  campaignId: campaign?.id || '',
                                }),
                              )
                            },
                          },
                          {
                            startIcon: 'trash',
                            title: translate('text_1732187313660we30lb9kg57'),
                            onAction: () => {
                              deleteCampaignDialogRef.current?.openDialog(campaign)
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

      <DeleteCampaignDialog ref={deleteCampaignDialogRef} />
    </>
  )
}

export default Dunnings
