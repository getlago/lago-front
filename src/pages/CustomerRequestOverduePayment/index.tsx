import { useFormik } from 'formik'
import { FC } from 'react'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import { object, string } from 'yup'

import { Button, Typography } from '~/components/designSystem'
import { CUSTOMER_DETAILS_ROUTE } from '~/core/router'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { EmailPreview } from '~/pages/CustomerRequestOverduePayment/components/EmailPreview'
import { validateEmails } from '~/pages/CustomerRequestOverduePayment/validateEmails'
import { NAV_HEIGHT, PageHeader, theme } from '~/styles'

import { FreemiumAlert } from './components/FreemiumAlert'
import {
  CustomerRequestOverduePaymentForm,
  RequestPaymentForm,
} from './components/RequestPaymentForm'

const FOOTER_HEIGHT = 80

interface CustomerRequestOverduePaymentProps {}

const CustomerRequestOverduePayment: FC<CustomerRequestOverduePaymentProps> = () => {
  const { translate } = useInternationalization()
  const { customerId } = useParams()
  const navigate = useNavigate()

  const formikProps = useFormik<CustomerRequestOverduePaymentForm>({
    initialValues: {
      emails: '',
    },
    validationSchema: object({
      emails: string()
        .required('')
        .test('valid-emails', 'One or more emails are invalid', (value) => validateEmails(value)),
    }),
    validateOnMount: true,
    onSubmit: () => {
      console.log('TODO: Request payment')
    },
  })

  return (
    <>
      <PageHeader>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate(
            'TODO: Request a payment of {{amount}} for {{count}} invoice|Request a payment of {{amount}} for {{count}} invoices',
          )}
        </Typography>

        <Button
          variant="quaternary"
          icon="close"
          onClick={() =>
            navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { customerId: customerId as string }))
          }
        />
      </PageHeader>

      <Main>
        <LeftSection>
          <FreemiumAlert />
          <Wrapper>
            <RequestPaymentForm formikProps={formikProps} />
          </Wrapper>
        </LeftSection>
        <RightSection>
          <Wrapper>
            <EmailPreview />
          </Wrapper>
        </RightSection>
      </Main>

      <PageFooter>
        <PageFooterWrapper>
          <Button
            variant="quaternary"
            size="large"
            onClick={() =>
              navigate(generatePath(CUSTOMER_DETAILS_ROUTE, { customerId: customerId as string }))
            }
          >
            {translate('TODO: Cancel')}
          </Button>
          <Button
            variant="primary"
            size="large"
            onClick={formikProps.submitForm}
            disabled={formikProps.dirty || !formikProps.isValid}
          >
            {translate('TODO: Request payment')}
          </Button>
        </PageFooterWrapper>
      </PageFooter>
    </>
  )
}

export default CustomerRequestOverduePayment

const Main = styled.main`
  height: calc(100vh - ${NAV_HEIGHT}px - ${FOOTER_HEIGHT}px);
  overflow-y: auto;

  ${theme.breakpoints.up('lg')} {
    height: calc(100vh - ${NAV_HEIGHT}px);
    display: flex;
    overflow-y: unset;
  }
`

const Section = styled.section`
  ${theme.breakpoints.up('lg')} {
    flex: 1 1 50%;
    overflow-y: auto;
  }
`

const LeftSection = styled(Section)`
  background-color: ${theme.palette.background.paper};

  ${theme.breakpoints.up('lg')} {
    height: calc(100vh - ${NAV_HEIGHT}px - ${FOOTER_HEIGHT}px);
  }
`

const RightSection = styled(Section)`
  background-color: ${theme.palette.grey[100]};
  box-shadow: ${theme.shadows[8]};
`

const Wrapper = styled.div`
  padding: ${theme.spacing(12)} ${theme.spacing(4)};

  ${theme.breakpoints.up('lg')} {
    padding: ${theme.spacing(12)};
  }
`

const PageFooter = styled.footer`
  position: fixed;
  bottom: 0;
  width: 100%;
  background-color: ${theme.palette.background.paper};
  box-shadow: ${theme.shadows[5]};
  height: ${FOOTER_HEIGHT}px;
  z-index: ${theme.zIndex.appBar};
  display: flex;
  justify-content: flex-end;
  align-items: center;

  ${theme.breakpoints.up('lg')} {
    width: 50%;
  }
`

const PageFooterWrapper = styled.div`
  display: flex;
  gap: ${theme.spacing(3)};
  margin-right: ${theme.spacing(4)};
`
