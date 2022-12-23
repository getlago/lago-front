import { useRef } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { Typography, Button, Skeleton, ShowMoreText } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { theme, NAV_HEIGHT } from '~/styles'
import {
  EditOrganizationInvoiceTemplateDialogFragmentDoc,
  useGetOrganizationInvoiceAndTaxInformationsQuery,
} from '~/generated/graphql'
import {
  EditOrganizationVatRateDialog,
  EditOrganizationVatRateDialogRef,
} from '~/components/settings/EditOrganizationVatRateDialog'
import {
  EditOrganizationInvoiceTemplateDialog,
  EditOrganizationInvoiceTemplateDialogRef,
} from '~/components/settings/EditOrganizationInvoiceTemplateDialog'
import { intlFormatNumber } from '~/core/formats/intlFormatNumber'
import { EditOrganizationGracePeriodDialog } from '~/components/settings/EditOrganizationGracePeriodDialog'

const MAX_FOOTER_LENGTH_DISPLAY_LIMIT = 200

gql`
  fragment OrganizationInvoiceTemplate on Organization {
    invoiceFooter
  }

  query getOrganizationInvoiceAndTaxInformations {
    currentUser {
      id
      organizations {
        id
        vatRate
        invoiceGracePeriod
        ...OrganizationInvoiceTemplate
        ...EditOrganizationInvoiceTemplateDialog
      }
    }
  }

  ${EditOrganizationInvoiceTemplateDialogFragmentDoc}
`

const VatRate = () => {
  const { translate } = useInternationalization()
  const editVATDialogRef = useRef<EditOrganizationVatRateDialogRef>(null)
  const editInvoiceTemplateDialogRef = useRef<EditOrganizationInvoiceTemplateDialogRef>(null)
  const editGracePeriodDialogRef = useRef<EditOrganizationInvoiceTemplateDialogRef>(null)
  const { data, error, loading } = useGetOrganizationInvoiceAndTaxInformationsQuery()
  const organization = (data?.currentUser?.organizations || [])[0]
  const vatRate = organization?.vatRate || 0
  const invoiceFooter = organization?.invoiceFooter || ''
  const invoiceGracePeriod = organization?.invoiceGracePeriod || 0

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
    <Page>
      <Title variant="headline">{translate('text_62ab2d0396dd6b0361614d24')}</Title>
      <Subtitle>{translate('text_637f819eff19cd55a56d55e2')}</Subtitle>

      <InlineSectionTitle>
        <Typography variant="subhead" color="grey700">
          {translate('text_637f819eff19cd55a56d55e6')}
        </Typography>
        <Button
          variant="quaternary"
          disabled={loading}
          onClick={editVATDialogRef?.current?.openDialog}
        >
          {translate('text_637f819eff19cd55a56d55e4')}
        </Button>
      </InlineSectionTitle>

      <InfoBlock>
        {loading ? (
          <>
            <Skeleton variant="text" width={320} height={12} marginBottom={theme.spacing(4)} />
            <Skeleton variant="text" width={160} height={12} />
          </>
        ) : (
          <>
            <Typography variant="body" color="grey700">
              {intlFormatNumber((vatRate || 0) / 100, {
                minimumFractionDigits: 2,
                style: 'percent',
              })}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate('text_637f819eff19cd55a56d55ea')}
            </Typography>
          </>
        )}
      </InfoBlock>

      <InlineSectionTitle>
        <Typography variant="subhead" color="grey700">
          {translate('text_638dc196fb209d551f3d8141')}
        </Typography>
        <Button
          variant="quaternary"
          size="large"
          disabled={loading}
          onClick={editGracePeriodDialogRef?.current?.openDialog}
        >
          {translate('text_637f819eff19cd55a56d55e4')}
        </Button>
      </InlineSectionTitle>

      <InfoBlock>
        {loading ? (
          <>
            <Skeleton variant="text" width={320} height={12} marginBottom={theme.spacing(4)} />
            <Skeleton variant="text" width={160} height={12} />
          </>
        ) : (
          <>
            <Typography variant="body" color="grey700">
              {translate(
                'text_638dc196fb209d551f3d81a2',
                { gracePeriod: invoiceGracePeriod },
                invoiceGracePeriod
              )}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate('text_638dc196fb209d551f3d81a6')}
            </Typography>
          </>
        )}
      </InfoBlock>

      <InlineSectionTitle>
        <Typography variant="subhead" color="grey700">
          {translate('text_637f819eff19cd55a56d55f6')}
        </Typography>
        <Button
          variant="quaternary"
          disabled={loading}
          onClick={editInvoiceTemplateDialogRef?.current?.openDialog}
        >
          {translate('text_6380d7e60f081e5b777c4b24')}
        </Button>
      </InlineSectionTitle>

      <InfoBlock>
        {loading ? (
          <>
            <Skeleton variant="text" width={320} height={12} marginBottom={theme.spacing(4)} />
            <Skeleton variant="text" width={160} height={12} />
          </>
        ) : !invoiceFooter ? (
          <>
            <Typography variant="body" color="grey700">
              {translate('text_637f819eff19cd55a56d55f8')}
            </Typography>
            <Typography variant="caption" color="grey600">
              {translate('text_637f819eff19cd55a56d55fa')}
            </Typography>
          </>
        ) : (
          <ShowMoreText
            variant="body"
            color="grey700"
            text={invoiceFooter}
            limit={MAX_FOOTER_LENGTH_DISPLAY_LIMIT}
          />
        )}
      </InfoBlock>

      <EditOrganizationVatRateDialog ref={editVATDialogRef} vatRate={vatRate as number} />
      <EditOrganizationInvoiceTemplateDialog
        ref={editInvoiceTemplateDialogRef}
        invoiceFooter={invoiceFooter}
      />
      <EditOrganizationGracePeriodDialog
        ref={editGracePeriodDialogRef}
        invoiceGracePeriod={invoiceGracePeriod}
      />
    </Page>
  )
}

const Page = styled.div`
  max-width: ${theme.spacing(168)};
  padding: ${theme.spacing(8)} ${theme.spacing(12)};
`

const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(2)};
`

const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
`

const InlineSectionTitle = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const InfoBlock = styled.div<{ $loading?: boolean }>`
  padding-top: ${({ $loading }) => ($loading ? theme.spacing(1) : 0)};
  padding-bottom: ${({ $loading }) => ($loading ? theme.spacing(9) : theme.spacing(8))};
  box-shadow: ${theme.shadows[7]};

  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(1)};
  }
`

export default VatRate
