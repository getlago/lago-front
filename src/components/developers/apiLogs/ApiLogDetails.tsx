import { Button, Skeleton, Typography } from 'lago-design-system'
import { Fragment } from 'react'
import { useParams } from 'react-router-dom'

import { CodeSnippet } from '~/components/CodeSnippet'
import { NavigationTab, TabManagedBy } from '~/components/designSystem'
import { HTTPMethod } from '~/components/developers/apiLogs/mapping'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

const fakeData = {
  requestId: 'dfbf53fe-34c6-4721-885f-0b68300b4fee',
  userEmail: 'mario@getlago.com',
  status: 'succeeded',
  httpMethod: HTTPMethod.POST,
  httpStatus: 200,
  path: 'api/v1/invoices',
  origin: 'https://api.getlago.com/',
  client: 'LagoRubySDKv1',
  apiKey: '*************-*****fbfd',
  apiVersion: 'v1',
  loggedAt: '2025-03-31T12:31:44Z',
  createdAt: '2025-03-31T12:35:00Z',
  requestBody: {
    customer: {
      id: '123',
      name: 'John Doe',
    },
  },
  responseBody: {
    customer: {
      id: '123',
      name: 'John Doe',
    },
  },
}
const loading = false

export const ApiLogDetails = ({ goBack }: { goBack: () => void }) => {
  const { logId } = useParams<{ logId: string }>()
  const { translate } = useInternationalization()
  const { formatTimeOrgaTZ } = useOrganizationInfos()

  const data = fakeData

  return (
    <>
      <Typography
        className="hidden min-h-14 items-center justify-between px-4 py-2 shadow-b md:flex"
        variant="bodyHl"
        color="textSecondary"
      >
        {loading ? <Skeleton variant="text" textVariant="bodyHl" className="w-30" /> : data.path}
      </Typography>

      {loading && (
        <div className="flex flex-col gap-4 p-4">
          <Skeleton variant="text" textVariant="subhead" className="w-40" />
          <div className="grid grid-cols-[140px,_1fr] items-baseline gap-x-8 gap-y-3">
            {[...Array(3)].map((_, index) => (
              <Fragment key={index}>
                <Skeleton variant="text" textVariant="caption" className="w-20" />
                <Skeleton variant="text" textVariant="caption" className="w-full" />
              </Fragment>
            ))}
          </div>
        </div>
      )}

      {!loading && (
        <div className="flex flex-col gap-12 p-4">
          <div className="grid grid-cols-[140px,_1fr] items-baseline gap-3 not-last:pb-12 not-last:shadow-b">
            <div className="col-span-2 flex items-center justify-between">
              <Typography variant="subhead" color="grey700">
                {translate('text_63ebba5f5160e26242c48bd2')}
              </Typography>
              <Button
                icon="close"
                variant="quaternary"
                size="small"
                onClick={() => goBack()}
                className="md:hidden"
              />
            </div>

            {[
              [translate('text_1749819996843c2c5f1j8e0n'), data.path],
              [translate('text_174981999903061p5t158es0'), data.requestId],
              [
                translate('text_17473520702542eqnulj06zc'),
                formatTimeOrgaTZ(data.createdAt, 'LLL dd, hh:mm:ss a'),
              ],
              [translate('text_645d071272418a14c1c76aa4'), data.apiKey],
              [translate('text_1749819999030wkju3ix3cb9'), data.apiVersion],
              [translate('text_1749819999030rydiujmrsfq'), data.origin],
              [translate('text_1749819999030dyt6hu7nspj'), data.client],
              [translate('text_174981999903024ai3h557wm'), data.httpStatus],
            ]
              .filter(([label, value]) => !!label && !!value)
              .map(([label, value]) => (
                <Fragment key={label}>
                  <Typography key={label} className="pt-1" variant="caption">
                    {label}
                  </Typography>
                  <Typography
                    className="overflow-wrap-anywhere flex min-w-0 max-w-full"
                    color="grey700"
                  >
                    {value}
                  </Typography>
                </Fragment>
              ))}
          </div>

          {(Object.keys(data.requestBody).length > 0 ||
            Object.keys(data.responseBody).length > 0) && (
            <div className="flex flex-col gap-4 pb-12">
              <Typography variant="subhead" color="grey700">
                {translate('text_1729773655417k0y7nxt5c5j')}
              </Typography>

              <NavigationTab
                managedBy={TabManagedBy.INDEX}
                name="api-log-details-tabs"
                tabs={[
                  {
                    title: translate('text_17498224925954a8mk0enwdj'),
                    hidden: Object.keys(data.responseBody).length === 0,
                    component: (
                      <CodeSnippet
                        variant="minimal"
                        language="json"
                        code={JSON.stringify(data.responseBody, null, 2)}
                        displayHead={false}
                        canCopy
                      />
                    ),
                  },
                  {
                    title: translate('text_1749822492595ayr96w7ez17'),
                    hidden: Object.keys(data.requestBody).length === 0,
                    component: (
                      <CodeSnippet
                        variant="minimal"
                        language="json"
                        code={JSON.stringify(data.requestBody, null, 2)}
                        displayHead={false}
                        canCopy
                      />
                    ),
                  },
                ]}
              />
            </div>
          )}
        </div>
      )}
    </>
  )
}
