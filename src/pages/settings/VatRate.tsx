import { useRef, useState } from 'react'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { Typography, Button, Skeleton, Avatar, Icon } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import ErrorImage from '~/public/images/maneki/error.svg'
import { GenericPlaceholder } from '~/components/GenericPlaceholder'
import { theme, NAV_HEIGHT, HEADER_TABLE_HEIGHT } from '~/styles'
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
        ...OrganizationInvoiceTemplate
        ...EditOrganizationInvoiceTemplateDialog
      }
    }
  }

  ${EditOrganizationInvoiceTemplateDialogFragmentDoc}
`

const VatRate = () => {
  const { translate } = useInternationalization()
  const [isTextTruncated, setIsTesxtTruncated] = useState(true)
  const editVATDialogRef = useRef<EditOrganizationVatRateDialogRef>(null)
  const editInvoiceTemplateDialogRef = useRef<EditOrganizationInvoiceTemplateDialogRef>(null)
  const { data, error, loading } = useGetOrganizationInvoiceAndTaxInformationsQuery()
  const organization = (data?.currentUser?.organizations || [])[0]
  const vatRate = organization?.vatRate || 0
  const invoiceFooter = organization?.invoiceFooter || ''

  const renderInvoiceFooter = () => {
    if (isTextTruncated && invoiceFooter.length > MAX_FOOTER_LENGTH_DISPLAY_LIMIT) {
      /* eslint-disable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events, jsx-a11y/anchor-is-valid */
      return (
        <>
          {invoiceFooter.substring(0, MAX_FOOTER_LENGTH_DISPLAY_LIMIT)}...
          <a onClick={() => setIsTesxtTruncated(false)}>
            {translate('text_62bdbf07117c3d1f178d6517')}
          </a>
        </>
      )
      /* eslint-enable jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events, jsx-a11y/anchor-is-valid */
    }

    return invoiceFooter
  }

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
      <Title variant="headline">{translate('text_62bb10ad2a10bd182d00202d')}</Title>
      <Subtitle>{translate('text_62bb10ad2a10bd182d002033')}</Subtitle>
      <Head $empty={true}>
        <Typography variant="subhead">{translate('text_62bb10ad2a10bd182d00203d')}</Typography>
        <Button variant="secondary" onClick={editInvoiceTemplateDialogRef?.current?.openDialog}>
          {translate('text_62bb10ad2a10bd182d002039')}
        </Button>
      </Head>

      <CustomFooterWrapper $loading={loading}>
        {loading ? (
          <>
            <SkeletonLabel variant="text" width={80} height={12} />
            <Skeleton variant="text" width={240} height={12} />
          </>
        ) : (
          <>
            <CustomFooterLabel>{translate('text_62bb10ad2a10bd182d002045')}</CustomFooterLabel>
            <CustomFooterValue>
              {invoiceFooter ? renderInvoiceFooter() : translate('text_62ab2d0396dd6b0361614d64')}
            </CustomFooterValue>
          </>
        )}
      </CustomFooterWrapper>

      <Title variant="headline">{translate('text_62728ff857d47b013204c776')}</Title>
      <Subtitle>{translate('text_62728ff857d47b013204c782')}</Subtitle>
      <Head $empty={typeof vatRate !== 'number' && !loading}>
        <Typography variant="subhead">{translate('text_62728ff857d47b013204c7ae')}</Typography>
        <Button variant="secondary" onClick={editVATDialogRef?.current?.openDialog}>
          {translate('text_62728ff857d47b013204c798')}
        </Button>
      </Head>

      <ListHead>
        <Typography variant="bodyHl" color="disabled">
          {translate('text_62728ff857d47b013204c7c4')}
        </Typography>
      </ListHead>
      <VatRateItem>
        {loading ? (
          <>
            <LeftBlock>
              <Skeleton variant="connectorAvatar" size="medium" />
              <Skeleton variant="text" width={240} height={12} />
            </LeftBlock>
          </>
        ) : (
          <LeftBlock>
            <Avatar variant="connector">
              <Icon color="dark" name="percentage" />
            </Avatar>
            <div>
              <Typography variant="bodyHl" color="textSecondary" noWrap>
                {translate('text_62728ff857d47b013204c7da', { taxRate: vatRate })}
              </Typography>
              <Typography variant="caption">
                {translate('text_62728ff857d47b013204c7f0')}
              </Typography>
            </div>
          </LeftBlock>
        )}
      </VatRateItem>
      {!loading && <Info variant="caption">{translate('text_62728ff857d47b013204c806')}</Info>}
      <EditOrganizationVatRateDialog ref={editVATDialogRef} vatRate={vatRate as number} />
      <EditOrganizationInvoiceTemplateDialog
        ref={editInvoiceTemplateDialogRef}
        invoiceFooter={invoiceFooter}
      />
    </Page>
  )
}

const Page = styled.div`
  padding: ${theme.spacing(12)};
`

const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(2)};
`

const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
`

const Head = styled.div<{ $empty?: boolean }>`
  height: ${NAV_HEIGHT}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
  margin-bottom: ${({ $empty }) => ($empty ? theme.spacing(6) : 0)};
`

const CustomFooterWrapper = styled.div<{ $loading?: boolean }>`
  min-height: ${({ $loading }) => ($loading ? theme.spacing(5) : 0)};
  display: flex;
  align-items: flex-start;
  margin-bottom: ${theme.spacing(12)};
`

const CustomFooterLabel = styled(Typography)`
  width: 140px;
  flex-shrink: 0;
  margin-right: ${theme.spacing(4)};
`
const CustomFooterValue = styled(Typography)`
  flex: 1;

  > a:hover {
    cursor: pointer;
  }
`

const SkeletonLabel = styled(Skeleton)`
  margin-right: ${theme.spacing(18)};
`

const ListHead = styled.div`
  display: flex;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
  height: ${HEADER_TABLE_HEIGHT}px;
`

const VatRateItem = styled.div`
  height: ${NAV_HEIGHT}px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: ${theme.shadows[7]};
`

const LeftBlock = styled.div`
  min-width: 0;
  display: flex;
  align-items: center;
  margin-right: ${theme.spacing(4)};

  > *:first-child {
    margin-right: ${theme.spacing(3)};
  }
`

const Info = styled(Typography)`
  height: ${HEADER_TABLE_HEIGHT}px;
  box-shadow: ${theme.shadows[7]};
  display: flex;
  justify-content: flex-end;
  align-items: center;
`

export default VatRate
