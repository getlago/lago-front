import { useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import { object, string, number, date } from 'yup'
import { DateTime } from 'luxon'
import { InputAdornment } from '@mui/material'
import styled from 'styled-components'

import { useCreateEditCoupon } from '~/hooks/useCreateEditCoupon'
import { PageHeader, Card, theme } from '~/styles'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { Typography, Button, Skeleton, Alert } from '~/components/designSystem'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { COUPONS_ROUTE } from '~/core/router'
import { TextInputField, ComboBoxField, DatePickerField, Checkbox } from '~/components/form'
import {
  CreateCouponInput,
  CurrencyEnum,
  CouponExpiration,
  CouponTypeEnum,
  CouponFrequency,
} from '~/generated/graphql'
import {
  Main,
  Content,
  Title,
  Subtitle,
  Side,
  SkeletonHeader,
  ButtonContainer,
  LineAmount,
} from '~/styles/mainObjectsForm'

import { CouponCodeSnippet } from '../components/coupons/CouponCodeSnippet'

const CreateCoupon = () => {
  const { translate } = useInternationalization()
  let navigate = useNavigate()
  const { isEdition, loading, coupon, onSave } = useCreateEditCoupon()
  const warningDialogRef = useRef<WarningDialogRef>(null)
  const formikProps = useFormik<CreateCouponInput>({
    initialValues: {
      // @ts-ignore
      amountCents: coupon?.amountCents
        ? coupon?.amountCents / 100
        : coupon?.amountCents || undefined,
      couponType: coupon?.couponType || CouponTypeEnum.FixedAmount,
      percentageRate: coupon?.percentageRate || undefined,
      name: coupon?.name || '',
      frequency: coupon?.frequency || CouponFrequency.Once,
      frequencyDuration: coupon?.frequencyDuration || undefined,
      amountCurrency: coupon?.amountCurrency || CurrencyEnum.Usd,
      code: coupon?.code || '',
      expiration: coupon?.expiration || CouponExpiration.NoExpiration,
      expirationDate: coupon?.expirationDate || undefined,
    },
    validationSchema: object().shape({
      amountCents: number().when('couponType', {
        is: (couponType: CouponTypeEnum) =>
          !!couponType && couponType === CouponTypeEnum.FixedAmount,
        then: number()
          .typeError(translate('text_624ea7c29103fd010732ab7d'))
          .min(0.001, 'text_632d68358f1fedc68eed3e91')
          .required(''),
      }),
      percentageRate: number().when('couponType', {
        is: (couponType: CouponTypeEnum) =>
          !!couponType && couponType === CouponTypeEnum.Percentage,
        then: number()
          .typeError(translate('text_624ea7c29103fd010732ab7d'))
          .min(0.001, 'text_633445d00315a713775f02a6')
          .required(''),
      }),
      name: string().required(''),
      amountCurrency: string().required(''),
      code: string().required(''),
      couponType: string().required(''),
      frequency: string().required(''),
      frequencyDuration: number().when('frequency', {
        is: (frequency: CouponFrequency) => !!frequency && frequency === CouponFrequency.Recurring,
        then: number()
          .typeError(translate('text_63314cfeb607e57577d894c9'))
          .min(1, 'text_63314cfeb607e57577d894c9')
          .required(''),
      }),
      expiration: string().required(''),
      expirationDate: date().when('expiration', {
        is: (expiration: CouponExpiration) =>
          !!expiration && expiration === CouponExpiration.TimeLimit,
        then: date()
          .min(
            DateTime.now().plus({ days: -1 }),
            translate('text_632d68358f1fedc68eed3ef2', {
              date: DateTime.now().plus({ days: -1 }).toFormat('LLL. dd, yyyy').toLocaleString(),
            })
          )
          .required(''),
      }),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: onSave,
  })

  return (
    <div>
      <PageHeader>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate(isEdition ? 'text_6287a9bdac160c00b2e0fbe7' : 'text_62876e85e32e0300e18030e7')}
        </Typography>
        <Button
          variant="quaternary"
          icon="close"
          onClick={() =>
            formikProps.dirty ? warningDialogRef.current?.openDialog() : navigate(COUPONS_ROUTE)
          }
        />
      </PageHeader>

      <Content>
        <Main>
          <div>
            {loading ? (
              <>
                <SkeletonHeader>
                  <Skeleton
                    variant="text"
                    width={280}
                    height={12}
                    marginBottom={theme.spacing(5)}
                  />
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

                  <ComboBoxField
                    disableClearable
                    name="couponType"
                    label={translate('text_632d68358f1fedc68eed3e5a')}
                    disabled={isEdition && !coupon?.canBeDeleted}
                    data={[
                      {
                        value: CouponTypeEnum.FixedAmount,
                        label: translate('text_632d68358f1fedc68eed3e60'),
                      },
                      {
                        value: CouponTypeEnum.Percentage,
                        label: translate('text_632d68358f1fedc68eed3e66'),
                      },
                    ]}
                    formikProps={formikProps}
                  />

                  {formikProps.values.couponType === CouponTypeEnum.FixedAmount ? (
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
                  ) : (
                    <TextInputField
                      name="percentageRate"
                      beforeChangeFormatter={['positiveNumber', 'decimal']}
                      disabled={isEdition && !coupon?.canBeDeleted}
                      label={translate('text_632d68358f1fedc68eed3e76')}
                      placeholder={translate('text_632d68358f1fedc68eed3e86')}
                      formikProps={formikProps}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            {translate('text_632d68358f1fedc68eed3e93')}
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}

                  <ComboBoxField
                    disabled={isEdition && !coupon?.canBeDeleted}
                    name="frequency"
                    label={translate('text_632d68358f1fedc68eed3e9d')}
                    helperText={translate('text_632d68358f1fedc68eed3eab')}
                    data={[
                      {
                        value: CouponFrequency.Once,
                        label: translate('text_632d68358f1fedc68eed3ea3'),
                      },
                      {
                        value: CouponFrequency.Recurring,
                        label: translate('text_632d68358f1fedc68eed3e64'),
                      },
                    ]}
                    disableClearable
                    formikProps={formikProps}
                  />

                  {formikProps.values.frequency === CouponFrequency.Recurring && (
                    <TextInputField
                      name="frequencyDuration"
                      beforeChangeFormatter={['positiveNumber', 'int']}
                      disabled={isEdition && !coupon?.canBeDeleted}
                      label={translate('text_632d68358f1fedc68eed3e80')}
                      placeholder={translate('text_632d68358f1fedc68eed3e88')}
                      formikProps={formikProps}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            {translate('text_632d68358f1fedc68eed3e95')}
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}

                  <Checkbox
                    name="hasLimit"
                    value={formikProps.values.expiration === CouponExpiration.TimeLimit}
                    label={translate('text_632d68358f1fedc68eed3eb7')}
                    onChange={(_, checked) => {
                      formikProps.setFieldValue(
                        'expiration',
                        checked ? CouponExpiration.TimeLimit : CouponExpiration.NoExpiration
                      )
                    }}
                  />

                  {formikProps.values.expiration === CouponExpiration.TimeLimit && (
                    <ExpirationLine>
                      <Typography variant="body" color="grey700">
                        {translate('text_632d68358f1fedc68eed3eb1')}
                      </Typography>
                      <DatePickerField
                        disablePast
                        name="expirationDate"
                        placement="top-end"
                        placeholder={translate('text_632d68358f1fedc68eed3ea5')}
                        formikProps={formikProps}
                      />
                    </ExpirationLine>
                  )}

                  {formikProps.values.couponType === CouponTypeEnum.FixedAmount &&
                    formikProps.values.frequency === CouponFrequency.Recurring && (
                      <Alert type="info">{translate('text_632d68358f1fedc68eed3ebd')}</Alert>
                    )}
                </Card>

                <ButtonContainer>
                  <Button
                    disabled={!formikProps.isValid || (isEdition && !formikProps.dirty)}
                    fullWidth
                    size="large"
                    onClick={formikProps.submitForm}
                  >
                    {translate(
                      isEdition ? 'text_6287a9bdac160c00b2e0fc6b' : 'text_62876e85e32e0300e180317d'
                    )}
                  </Button>
                </ButtonContainer>
              </>
            )}
          </div>
        </Main>
        <Side>
          <CouponCodeSnippet loading={loading} coupon={formikProps.values} />
        </Side>
      </Content>

      <WarningDialog
        ref={warningDialogRef}
        title={translate(
          isEdition ? 'text_6287a9bdac160c00b2e0fbeb' : 'text_62876e85e32e0300e18030f5'
        )}
        description={translate(
          isEdition ? 'text_6287a9bdac160c00b2e0fbf1' : 'text_62876e85e32e0300e18030fc'
        )}
        continueText={translate(
          isEdition ? 'text_6287a9bdac160c00b2e0fbfd' : 'text_62876e85e32e0300e180310b'
        )}
        onContinue={() => navigate(COUPONS_ROUTE)}
      />
    </div>
  )
}

const ExpirationLine = styled.div`
  display: flex;
  align-items: center;

  > *:first-child {
    margin-right: ${theme.spacing(3)};
    flex-shrink: 0;
  }

  > *:last-child {
    flex: 1;
  }
`

export default CreateCoupon
