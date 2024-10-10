import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  Avatar,
  Button,
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
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'

const Dunnings = () => {
  const navigate = useNavigate()
  const { translate } = useInternationalization()
  const defaultCampaignDialogRef = useRef<DefaultCampaignDialogRef>(null)

  const loading = false
  const error = false
  const FAKE_DATA = [
    {
      id: '1',
      name: 'Dunning 1',
      code: 'DUN-1',
      isDefault: true,
    },
    {
      id: '2',
      name: 'Dunning 2',
      code: 'DUN-2',
      isDefault: false,
    },
    {
      id: '3',
      name: 'Dunning 3',
      code: 'DUN-3',
      isDefault: false,
    },
  ]
  const hasData = false

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
                  action={
                    <Button
                      variant="quaternary"
                      disabled={loading}
                      onClick={() => {
                        // TODO: navigate to create dunning page
                        navigate('')
                      }}
                      data-test="create-dunning-button"
                    >
                      {translate('text_645bb193927b375079d28ad2')}
                    </Button>
                  }
                />
                {!hasData ? (
                  <Typography variant="body" color="grey500">
                    {translate('text_17285860642666dsgcx901iq')}
                  </Typography>
                ) : (
                  <InfiniteScroll
                    onBottom={
                      // TODO: fetch more data
                      () => {}
                    }
                  >
                    <Table
                      name="dunnings-settings-list"
                      containerSize={{ default: 0 }}
                      rowSize={72}
                      isLoading={loading}
                      data={FAKE_DATA}
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
                          key: 'isDefault',
                          title: translate('text_63ac86d797f728a87b2f9fa7'),
                          content: ({ isDefault }) => isDefault && <Chip label="Default" />,
                        },
                      ]}
                      actionColumnTooltip={() => translate('text_17285747264959xu1spelnh9')}
                      actionColumn={(campaign) => {
                        return [
                          campaign.isDefault
                            ? {
                                startIcon: 'star-outlined-hidden',
                                title: translate('text_1728574726495j7n9zqj7o71'),
                                onAction: () => {
                                  defaultCampaignDialogRef.current?.openDialog({
                                    type: 'removeDefault',
                                    onConfirm: () => {
                                      // TODO: remove default dunning campaign
                                      addToast({
                                        message: translate('text_1728574726495a0wc21wqxnm'),
                                        severity: 'success',
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
                                      // TODO: set default dunning campaign
                                      addToast({
                                        message: translate('text_1728574726495p3lgzy38pah'),
                                        severity: 'success',
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
