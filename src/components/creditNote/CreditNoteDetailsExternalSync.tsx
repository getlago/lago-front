import { Stack } from '@mui/material'
import { Icon, Typography } from 'lago-design-system'
import { Link, useParams } from 'react-router-dom'

import { DetailsPage } from '~/components/layouts/DetailsPage'
import { addToast, envGlobalVar } from '~/core/apolloClient'
import {
  buildAnrokCreditNoteUrl,
  buildAvalaraObjectId,
  buildNetsuiteCreditNoteUrl,
  buildXeroCreditNoteUrl,
} from '~/core/constants/externalUrls'
import { AppEnvEnum } from '~/core/constants/globalTypes'
import {
  AvalaraIntegration,
  NetsuiteIntegration,
  useGetCreditNoteQuery,
  useIntegrationsListForCreditNoteDetailsQuery,
  useRetryTaxReportingMutation,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { SectionHeader } from '~/styles/customer'

const { appEnv } = envGlobalVar()

export const CreditNoteDetailsExternalSync = () => {
  const { customerId, creditNoteId } = useParams()
  const { translate } = useInternationalization()

  const { data } = useGetCreditNoteQuery({
    variables: { id: creditNoteId as string },
    skip: !creditNoteId || !customerId,
  })

  const { data: integrationsData } = useIntegrationsListForCreditNoteDetailsQuery({
    variables: { limit: 1000 },
    skip:
      !data?.creditNote?.customer?.netsuiteCustomer?.integrationId &&
      !data?.creditNote?.customer?.xeroCustomer?.integrationId &&
      !data?.creditNote?.customer?.anrokCustomer?.integrationId &&
      !data?.creditNote?.customer?.avalaraCustomer?.id,
  })
  const allNetsuiteIntegrations = integrationsData?.integrations?.collection.filter(
    (i) => i.__typename === 'NetsuiteIntegration',
  ) as NetsuiteIntegration[] | undefined

  const allAvalaraIntegrations = integrationsData?.integrations?.collection.filter(
    (i) => i.__typename === 'AvalaraIntegration',
  ) as AvalaraIntegration[] | undefined

  const connectedNetsuiteIntegration = allNetsuiteIntegrations?.find(
    (integration) =>
      integration?.id === data?.creditNote?.customer?.netsuiteCustomer?.integrationId,
  ) as NetsuiteIntegration

  const connectedAvalaraIntegration = allAvalaraIntegrations?.find(
    (integration) => integration?.id === data?.creditNote?.customer?.avalaraCustomer?.integrationId,
  ) as AvalaraIntegration

  const [retryTaxReporting] = useRetryTaxReportingMutation({
    onCompleted() {
      addToast({
        severity: 'success',
        translateKey: 'text_1727068261852148l97frl5q',
      })
    },
    refetchQueries: ['getCreditNote'],
  })

  const retryTaxSync = async () => {
    if (!data?.creditNote?.id) return

    await retryTaxReporting({
      variables: {
        input: {
          id: data.creditNote.id,
        },
      },
    })
  }

  const creditNote = data?.creditNote

  return (
    (connectedNetsuiteIntegration ||
      connectedAvalaraIntegration ||
      data?.creditNote?.customer?.xeroCustomer?.integrationId ||
      data?.creditNote?.taxProviderId ||
      data?.creditNote?.taxProviderSyncable) &&
    creditNote?.id && (
      <Stack marginTop={8} gap={6}>
        <SectionHeader variant="subhead">
          {translate('text_6650b36fc702a4014c878996')}
        </SectionHeader>
        {!!connectedNetsuiteIntegration && creditNote?.externalIntegrationId && (
          <DetailsPage.OverviewLine
            title={translate('text_6684044e95fa220048a145a7')}
            value={
              <Link
                className="w-fit line-break-anywhere visited:text-blue hover:no-underline"
                target="_blank"
                rel="noopener noreferrer"
                to={buildNetsuiteCreditNoteUrl(
                  connectedNetsuiteIntegration?.accountId,
                  creditNote?.externalIntegrationId,
                )}
              >
                <Typography variant="body" className="flex items-center gap-1 text-blue">
                  {creditNote?.externalIntegrationId} <Icon name="outside" />
                </Typography>
              </Link>
            }
          />
        )}
        {!!data?.creditNote?.customer?.xeroCustomer?.integrationId &&
          creditNote?.externalIntegrationId && (
            <DetailsPage.OverviewLine
              title={translate('text_66911ce41415f40090d053ce')}
              value={
                <Link
                  className="w-fit line-break-anywhere visited:text-blue hover:no-underline"
                  target="_blank"
                  rel="noopener noreferrer"
                  to={buildXeroCreditNoteUrl(creditNote?.externalIntegrationId)}
                >
                  <Typography variant="body" className="text-blue">
                    {creditNote?.externalIntegrationId} <Icon name="outside" />
                  </Typography>
                </Link>
              }
            />
          )}

        {!!data?.creditNote?.customer?.anrokCustomer?.integrationId && (
          <div>
            {!!data?.creditNote?.taxProviderId && (
              <DetailsPage.OverviewLine
                title={translate('text_1727068146263345gopo39sm')}
                value={
                  <Link
                    className="w-fit line-break-anywhere visited:text-blue hover:no-underline"
                    target="_blank"
                    rel="noopener noreferrer"
                    to={buildAnrokCreditNoteUrl(
                      data?.creditNote?.customer?.anrokCustomer?.externalAccountId,
                      data?.creditNote?.taxProviderId,
                    )}
                  >
                    <Typography variant="body" className="flex items-center gap-1 text-blue">
                      {data?.creditNote?.taxProviderId} <Icon name="outside" />
                    </Typography>
                  </Link>
                }
              />
            )}

            {!!data?.creditNote?.taxProviderSyncable && (
              <DetailsPage.OverviewLine
                title={translate('text_1727068146263345gopo39sm')}
                value={
                  <div className="flex items-center gap-2">
                    <Icon name="warning-filled" color="warning" />
                    <Typography variant="body">
                      {translate('text_1727068146263ztoat7i901x')}
                    </Typography>
                    <Typography variant="body">•</Typography>
                    <Link
                      className="w-fit line-break-anywhere visited:text-blue hover:no-underline"
                      to="#"
                      onClick={async () => {
                        await retryTaxSync()
                      }}
                    >
                      <Typography variant="body" className="text-blue">
                        {translate('text_17270681462632d46dh3r1vu')}
                      </Typography>
                    </Link>
                  </div>
                }
              />
            )}
          </div>
        )}

        {!!data?.creditNote?.customer?.avalaraCustomer?.id && !!connectedAvalaraIntegration && (
          <div>
            {!!data?.creditNote?.taxProviderId && (
              <DetailsPage.OverviewLine
                title={translate('text_1747408519913t2tehiclc5q')}
                value={
                  <Link
                    className="w-fit line-break-anywhere visited:text-blue hover:no-underline"
                    target="_blank"
                    rel="noopener noreferrer"
                    to={buildAvalaraObjectId({
                      accountId: connectedAvalaraIntegration?.accountId,
                      companyId: connectedAvalaraIntegration.companyId || '',
                      objectId: data?.creditNote?.taxProviderId,
                      isSandbox: appEnv !== AppEnvEnum.production,
                    })}
                  >
                    <Typography variant="body" className="flex items-center gap-1 text-blue">
                      {data?.creditNote?.taxProviderId} <Icon name="outside" />
                    </Typography>
                  </Link>
                }
              />
            )}

            {!!data?.creditNote?.taxProviderSyncable && (
              <DetailsPage.OverviewLine
                title={translate('text_1747408519913t2tehiclc5q')}
                value={
                  <div className="flex items-center gap-2">
                    <Icon name="warning-filled" color="warning" />
                    <Typography variant="body">
                      {translate('text_1727068146263ztoat7i901x')}
                    </Typography>
                    <Typography variant="body">•</Typography>
                    <Link
                      className="w-fit line-break-anywhere visited:text-blue hover:no-underline"
                      to="#"
                      onClick={async () => {
                        await retryTaxSync()
                      }}
                    >
                      <Typography variant="body" className="text-blue">
                        {translate('text_17270681462632d46dh3r1vu')}
                      </Typography>
                    </Link>
                  </div>
                }
              />
            )}
          </div>
        )}
      </Stack>
    )
  )
}
