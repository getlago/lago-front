import { useFormik } from 'formik'
import { object, string, number } from 'yup'
import styled from 'styled-components'

import {
  CreateCouponInput,
  CurrencyEnum,
  CouponExpiration,
  EditCouponFragment,
} from '~/generated/graphql'
import { theme, NAV_HEIGHT, Card } from '~/styles'
import { Typography, Button, Skeleton } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { TextInputField, ComboBoxField } from '~/components/form'

import { CouponCodeSnippet } from './CouponCodeSnippet'

interface CouponFormProps {
  coupon?: EditCouponFragment
  loading?: boolean
  isEdition?: boolean
  onSave: (values: CreateCouponInput) => Promise<void>
}

export const CouponForm = ({ isEdition, loading, coupon, onSave }: CouponFormProps) => {
  const { translate } = useInternationalization()
  const formikProps = useFormik<CreateCouponInput>({
    initialValues: {
      // @ts-ignore
      amountCents: coupon?.amountCents
        ? coupon?.amountCents / 100
        : coupon?.amountCents || undefined,
      name: coupon?.name || '',
      amountCurrency: coupon?.amountCurrency || CurrencyEnum.Usd,
      code: coupon?.code || '',
      expiration: coupon?.expiration || CouponExpiration.NoExpiration,
      expirationDuration: coupon?.expirationDuration || undefined,
    },
    validationSchema: object().shape({
      amountCents: number().min(1, 'text_62978f2c197cea009ab0b7d4').required(''),
      name: string().required(''),
      amountCurrency: string().required(''),
      code: string().required(''),
      expiration: string().required(''),
      expirationDuration: number().when('expiration', {
        is: (expiration: CouponExpiration) =>
          !!expiration && expiration === CouponExpiration.TimeLimit,
        then: number().min(1, 'text_62876e85e32e0300e180317b').required(''),
      }),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: onSave,
  })

  return (
    <Content>
      <Main>
        <div>
          {loading ? (
            <>
              <SkeletonHeader>
                <Skeleton variant="text" width={280} height={12} marginBottom={theme.spacing(5)} />
                <Skeleton
                  variant="text"
                  width="inherit"
                  height={12}
                  marginBottom={theme.spacing(4)}
                />
                <Skeleton variant="text" width={120} height={12} />
              </SkeletonHeader>

              {[0, 1].map((skeletonCard) => (
                <Card key={`skeleton-${skeletonCard}`}>
                  <Skeleton
                    variant="text"
                    width={280}
                    height={12}
                    marginBottom={theme.spacing(9)}
                  />
                  <Skeleton
                    variant="text"
                    width="inherit"
                    height={12}
                    marginBottom={theme.spacing(4)}
                  />
                  <Skeleton variant="text" width={120} height={12} />
                </Card>
              ))}
            </>
          ) : (
            <>
              <div>
                <Title variant="headline">
                  {translate(
                    isEdition ? 'text_6287a9bdac160c00b2e0fc05' : 'text_62876e85e32e0300e1803106'
                  )}
                </Title>
                <Subtitle>
                  {translate(
                    isEdition ? 'text_6287a9bdac160c00b2e0fc0b' : 'text_62876e85e32e0300e180310f'
                  )}
                </Subtitle>
              </div>
              <Card>
                <Typography variant="subhead">
                  {translate('text_62876e85e32e0300e1803115')}
                </Typography>

                <TextInputField
                  name="name"
                  label={translate('text_62876e85e32e0300e180311b')}
                  placeholder={translate('text_62876e85e32e0300e1803121')}
                  // eslint-disable-next-line jsx-a11y/no-autofocus
                  autoFocus
                  formikProps={formikProps}
                />
                <TextInputField
                  name="code"
                  beforeChangeFormatter="code"
                  disabled={isEdition && !coupon?.canBeDeleted}
                  label={translate('text_62876e85e32e0300e1803127')}
                  placeholder={translate('text_62876e85e32e0300e180312d')}
                  formikProps={formikProps}
                  helperText={translate('text_62876e85e32e0300e1803131')}
                />
              </Card>
              <Card>
                <Typography variant="subhead">
                  {translate('text_62876e85e32e0300e1803137')}
                </Typography>

                <LineAmount>
                  <TextInputField
                    name="amountCents"
                    beforeChangeFormatter={['positiveNumber', 'decimal']}
                    disabled={isEdition && !coupon?.canBeDeleted}
                    label={translate('text_62978f2c197cea009ab0b7d0')}
                    placeholder={translate('text_62978f2c197cea009ab0b7d2')}
                    formikProps={formikProps}
                  />
                  <ComboBoxField
                    disabled={isEdition && !coupon?.canBeDeleted}
                    name="amountCurrency"
                    data={Object.values(CurrencyEnum).map((currencyType) => ({
                      value: currencyType,
                    }))}
                    disableClearable
                    formikProps={formikProps}
                  />
                </LineAmount>

                <ComboBoxField
                  disabled={isEdition && !coupon?.canBeDeleted}
                  name="expiration"
                  data={[
                    {
                      value: CouponExpiration.TimeLimit,
                      label: translate('text_62876e85e32e0300e1803165'),
                    },
                    {
                      value: CouponExpiration.NoExpiration,
                      label: translate('text_62876e85e32e0300e1803157'),
                    },
                  ]}
                  disableClearable
                  formikProps={formikProps}
                />

                {formikProps.values.expiration === CouponExpiration.TimeLimit && (
                  <TextInputField
                    name="expirationDuration"
                    beforeChangeFormatter={['int', 'positiveNumber']}
                    disabled={isEdition && !coupon?.canBeDeleted}
                    label={translate('text_62876e85e32e0300e180316c')}
                    placeholder={translate('text_62876e85e32e0300e1803172')}
                    formikProps={formikProps}
                    InputProps={{
                      endAdornment: (
                        <InputEnd color="textSecondary">
                          {translate('text_62876e85e32e0300e1803178')}
                        </InputEnd>
                      ),
                    }}
                  />
                )}
              </Card>

              <ButtonContainer>
                <SubmitButton
                  disabled={!formikProps.isValid || (isEdition && !formikProps.dirty)}
                  fullWidth
                  size="large"
                  onClick={formikProps.submitForm}
                >
                  {translate(
                    isEdition ? 'text_6287a9bdac160c00b2e0fc6b' : 'text_62876e85e32e0300e180317d'
                  )}
                </SubmitButton>
              </ButtonContainer>
            </>
          )}
        </div>
      </Main>
      <Side>
        <CouponCodeSnippet loading={loading} coupon={formikProps.values} />
      </Side>
    </Content>
  )
}

const Main = styled.div`
  width: 60%;
  box-sizing: border-box;
  padding: ${theme.spacing(12)} ${theme.spacing(12)} 0 ${theme.spacing(12)};

  > div {
    max-width: 720px;

    > *:not(:last-child) {
      margin-bottom: ${theme.spacing(8)};
    }
  }

  ${theme.breakpoints.down('md')} {
    width: 100%;
    padding: ${theme.spacing(12)} ${theme.spacing(4)} 0;
  }
`

const Content = styled.div`
  display: flex;
  min-height: calc(100vh - ${NAV_HEIGHT}px);
`

const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(1)};
  padding: 0 ${theme.spacing(8)};
`

const Subtitle = styled(Typography)`
  margin-bottom: ${theme.spacing(8)};
  padding: 0 ${theme.spacing(8)};
`

const Side = styled.div`
  width: 40%;
  position: relative;
  background-color: ${theme.palette.grey[100]};

  > div {
    position: sticky;
    top: ${NAV_HEIGHT}px;
    height: calc(100vh - ${NAV_HEIGHT}px);
  }

  ${theme.breakpoints.down('md')} {
    display: none;
  }
`

const SkeletonHeader = styled.div`
  padding: 0 ${theme.spacing(8)};
`

const SubmitButton = styled(Button)`
  margin-bottom: ${theme.spacing(20)};
`

const ButtonContainer = styled.div`
  margin: 0 ${theme.spacing(6)};
`

const LineAmount = styled.div`
  display: flex;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
    flex: 1;
  }

  > *:last-child {
    max-width: 120px;
    margin-top: 24px;
  }
`

const InputEnd = styled(Typography)`
  margin-right: ${theme.spacing(4)};
`
