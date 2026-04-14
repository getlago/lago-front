import { Status } from '~/components/designSystem/Status'
import { Table, TableColumn } from '~/components/designSystem/Table/Table'
import { Typography } from '~/components/designSystem/Typography'
import { DetailsPage } from '~/components/layouts/DetailsPage'
import { QuoteDetailItemFragment, QuoteListItemFragment } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { getQuoteStatusMapping } from './common/getQuoteStatusMapping'
import { getQuoteTypeTranslationKey } from './common/getQuoteTypetranslationKey'
import { useQuotes } from './useQuotes'

interface QuoteDetailsVersionsProps {
  quote: QuoteDetailItemFragment
}

const QuoteDetailsVersions = ({ quote }: QuoteDetailsVersionsProps) => {
  const { translate } = useInternationalization()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()
  const { quotes: versions, loading } = useQuotes({
    number: quote.number,
    latestVersionOnly: false,
  })

  const versionColumns: Array<TableColumn<QuoteListItemFragment>> = [
    {
      key: 'status',
      title: translate('text_63ac86d797f728a87b2f9fa7'),
      minWidth: 100,
      content: ({ status }) => <Status {...getQuoteStatusMapping(status, translate)} />,
    },
    {
      key: 'version',
      maxSpace: true,
      title: translate('text_1775747115932pql5mtb30dc'),
      minWidth: 80,
      content: ({ number, version }) => (
        <Typography color="grey600">
          {number} - v{version}
        </Typography>
      ),
    },
    {
      key: 'currency',
      title: translate('text_632b4acf0c41206cbcb8c324'),
      minWidth: 100,
      content: ({ currency }) => <Typography color="grey600">{currency || '-'}</Typography>,
    },
    {
      key: 'createdAt',
      title: translate('text_17758254440392sc27lxm6ua'),
      maxSpace: true,
      minWidth: 120,
      content: ({ createdAt }) => (
        <Typography color="grey600">{intlFormatDateTimeOrgaTZ(createdAt).date}</Typography>
      ),
    },
  ]

  const quoteDetails = [
    {
      label: translate('text_177581001572954eedouxq5u'),
      value: quote.number,
    },
    {
      label: translate('text_65201c5a175a4b0238abf29a'),
      value: `${quote.customer.name} - ${quote.customer.externalId}`,
    },
    {
      label: translate('text_6560809c38fb9de88d8a52fb'),
      value: translate(getQuoteTypeTranslationKey(quote.orderType)),
    },
  ]

  return (
    <DetailsPage.Container className="gap-12 pt-12">
      <section className="flex flex-col gap-4 pb-12 shadow-b">
        <div className="flex flex-col gap-2">
          <Typography variant="subhead1">{translate('text_17757493673753qivx6ijtc0')}</Typography>
          <Typography variant="caption">{translate('text_1775807564102me0jot8mmkl')}</Typography>
        </div>
        <div className="grid grid-cols-[200px_1fr] gap-x-4 gap-y-2">
          {quoteDetails.map(({ label, value }) => (
            <>
              <Typography color="grey600" variant="caption">
                {label}
              </Typography>
              <Typography variant="body" color="grey700">
                {value}
              </Typography>
            </>
          ))}
        </div>
      </section>
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Typography variant="subhead1">{translate('text_1775825275651t25f8xbhmai')}</Typography>
          <Typography variant="caption">{translate('text_1775825275651evevz6qh4d0')}</Typography>
        </div>
        <Table
          name="quote-versions"
          data={versions}
          isLoading={loading}
          containerSize={0}
          columns={versionColumns}
        />
      </section>
    </DetailsPage.Container>
  )
}

export default QuoteDetailsVersions
