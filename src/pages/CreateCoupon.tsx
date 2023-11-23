import { InputAdornment } from '@mui/material'
import { useFormik } from 'formik'
import isEqual from 'lodash/isEqual'
import { DateTime } from 'luxon'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { date, number, object, string } from 'yup'

import {
  AddBillableMetricToCouponDialog,
  AddBillableMetricToCouponDialogRef,
} from '~/components/coupons/AddBillableMetricToCouponDialog'
import {
  AddPlanToCouponDialog,
  AddPlanToCouponDialogRef,
} from '~/components/coupons/AddPlanToCouponDialog'
import {
  Alert,
  Avatar,
  Button,
  Icon,
  Skeleton,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import {
  AmountInputField,
  Checkbox,
  ComboBoxField,
  DatePickerField,
  TextInputField,
} from '~/components/form'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { FORM_ERRORS_ENUM } from '~/core/constants/form'
import { COUPONS_ROUTE } from '~/core/router'
import { deserializeAmount } from '~/core/serializers/serializeAmount'
import {
  BillableMetricsForCouponsFragment,
  CouponExpiration,
  CouponFrequency,
  CouponTypeEnum,
  CreateCouponInput,
  CurrencyEnum,
  PlansForCouponsFragment,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCreateEditCoupon } from '~/hooks/useCreateEditCoupon'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'
import { ButtonGroup, Card, PageHeader, theme } from '~/styles'
import {
  ButtonContainer,
  Content,
  LineAmount,
  Main,
  Side,
  SkeletonHeader,
  Subtitle,
  Title,
} from '~/styles/mainObjectsForm'

import { CouponCodeSnippet } from '../components/coupons/CouponCodeSnippet'

const CreateCoupon = () => {
  const { translate } = useInternationalization()
  let navigate = useNavigate()
  const { organization } = useOrganizationInfos()
  const {
    isEdition,
    loading,
    coupon,
    errorCode,
    onSave,
    hasPlanLimit,
    setHasPlanLimit,
    limitPlansList,
    setLimitPlansList,
    hasBillableMetricLimit,
    setHasBillableMetricLimit,
    limitBillableMetricsList,
    setLimitBillableMetricsList,
  } = useCreateEditCoupon()
  const warningDialogRef = useRef<WarningDialogRef>(null)
  const addPlanToCouponDialogRef = useRef<AddPlanToCouponDialogRef>(null)
  const addBillableMetricToCouponDialogRef = useRef<AddBillableMetricToCouponDialogRef>(null)
  const formikProps = useFormik<CreateCouponInput>({
    initialValues: {
      amountCents: coupon?.amountCents
        ? String(deserializeAmount(coupon?.amountCents, coupon?.amountCurrency || CurrencyEnum.Usd))
        : coupon?.amountCents || undefined,
      amountCurrency: coupon?.amountCurrency || organization?.defaultCurrency || CurrencyEnum.Usd,
      code: coupon?.code || '',
      couponType: coupon?.couponType || CouponTypeEnum.FixedAmount,
      description: coupon?.description || '',
      expiration: coupon?.expiration || CouponExpiration.NoExpiration,
      expirationAt: coupon?.expirationAt || undefined,
      frequency: coupon?.frequency || CouponFrequency.Once,
      frequencyDuration: coupon?.frequencyDuration || undefined,
      name: coupon?.name || '',
      percentageRate: coupon?.percentageRate || undefined,
      reusable: coupon?.reusable === undefined ? true : coupon.reusable,
    },
    validationSchema: object().shape({
      amountCents: number().when('couponType', {
        is: (couponType: CouponTypeEnum) =>
          !!couponType && couponType === CouponTypeEnum.FixedAmount,
        then: (schema) =>
          schema
            .typeError(translate('text_624ea7c29103fd010732ab7d'))
            .min(0.001, 'text_632d68358f1fedc68eed3e91')
            .required(''),
      }),
      percentageRate: number().when('couponType', {
        is: (couponType: CouponTypeEnum) =>
          !!couponType && couponType === CouponTypeEnum.Percentage,
        then: (schema) =>
          schema
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
        then: (schema) =>
          schema
            .typeError(translate('text_63314cfeb607e57577d894c9'))
            .min(1, 'text_63314cfeb607e57577d894c9')
            .required(''),
      }),
      reusable: string().required(''),
      expiration: string().required(''),
      expirationAt: date().when('expiration', {
        is: (expiration: CouponExpiration) =>
          !!expiration && expiration === CouponExpiration.TimeLimit,
        then: (schema) =>
          schema
            .min(
              DateTime.now().plus({ days: -1 }),
              translate('text_632d68358f1fedc68eed3ef2', {
                date: DateTime.now().plus({ days: -1 }).toFormat('LLL. dd, yyyy').toLocaleString(),
              }),
            )
            .required(''),
      }),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: onSave,
  })
  const [shouldDisplayDescription, setShouldDisplayDescription] = useState<boolean>(
    !!formikProps.initialValues.description,
  )

  const attachPlanToCoupon = (plan: PlansForCouponsFragment) => {
    if (limitPlansList.length === 0) {
      setHasBillableMetricLimit(false)
    }
    setLimitPlansList((oldArray: PlansForCouponsFragment[]) => [...oldArray, plan])
  }

  const attachBillableMetricToCoupon = (billableMetric: BillableMetricsForCouponsFragment) => {
    if (limitBillableMetricsList.length === 0) {
      setHasPlanLimit(false)
    }
    setLimitBillableMetricsList((oldArray: BillableMetricsForCouponsFragment[]) => [
      ...oldArray,
      billableMetric,
    ])
  }

  useEffect(() => {
    setShouldDisplayDescription(!!formikProps.initialValues.description)
  }, [formikProps.initialValues.description])

  useEffect(() => {
    if (errorCode === FORM_ERRORS_ENUM.existingCode) {
      formikProps.setFieldError('code', 'text_632a2d437e341dcc76817556')
      const rootElement = document.getElementById('root')

      if (!rootElement) return
      rootElement.scrollTo({ top: 0 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorCode])

  useEffect(() => {
    if (
      (hasPlanLimit || hasBillableMetricLimit) &&
      limitBillableMetricsList.length === 0 &&
      limitPlansList.length === 0
    ) {
      setHasPlanLimit(true)
      setHasBillableMetricLimit(true)
    }
  }, [
    setHasBillableMetricLimit,
    setHasPlanLimit,
    hasBillableMetricLimit,
    hasPlanLimit,
    limitBillableMetricsList,
    limitPlansList,
  ])

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
                      isEdition ? 'text_6287a9bdac160c00b2e0fc05' : 'text_62876e85e32e0300e1803106',
                    )}
                  </Title>
                  <Subtitle>
                    {translate(
                      isEdition ? 'text_6287a9bdac160c00b2e0fc0b' : 'text_62876e85e32e0300e180310f',
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
                    disabled={isEdition && !!coupon?.appliedCouponsCount}
                    label={translate('text_62876e85e32e0300e1803127')}
                    placeholder={translate('text_62876e85e32e0300e180312d')}
                    formikProps={formikProps}
                    helperText={translate('text_62876e85e32e0300e1803131')}
                  />

                  {shouldDisplayDescription ? (
                    <InlineDescription>
                      <TextArea
                        multiline
                        name="description"
                        label={translate('text_649e848fa4c023006e94ca32')}
                        placeholder={translate('text_649e85d35208d700473f79c9')}
                        rows="3"
                        formikProps={formikProps}
                      />
                      <CloseDescriptionTooltip
                        placement="top-end"
                        title={translate('text_63aa085d28b8510cd46443ff')}
                      >
                        <Button
                          icon="trash"
                          variant="quaternary"
                          onClick={() => {
                            formikProps.setFieldValue('description', '')
                            setShouldDisplayDescription(false)
                          }}
                        />
                      </CloseDescriptionTooltip>
                    </InlineDescription>
                  ) : (
                    <Button
                      startIcon="plus"
                      variant="quaternary"
                      onClick={() => setShouldDisplayDescription(true)}
                      data-test="show-description"
                    >
                      {translate('text_642d5eb2783a2ad10d670324')}
                    </Button>
                  )}
                </Card>
                <Card>
                  <Typography variant="subhead">
                    {translate('text_62876e85e32e0300e1803137')}
                  </Typography>

                  <ComboBoxField
                    disableClearable
                    name="couponType"
                    label={translate('text_632d68358f1fedc68eed3e5a')}
                    disabled={isEdition && !!coupon?.appliedCouponsCount}
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
                      <AmountInputField
                        name="amountCents"
                        currency={formikProps.values.amountCurrency || CurrencyEnum.Usd}
                        beforeChangeFormatter={['positiveNumber']}
                        disabled={isEdition && !!coupon?.appliedCouponsCount}
                        label={translate('text_62978f2c197cea009ab0b7d0')}
                        formikProps={formikProps}
                      />
                      <ComboBoxField
                        disabled={isEdition && !!coupon?.appliedCouponsCount}
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
                      disabled={isEdition && !!coupon?.appliedCouponsCount}
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
                    disabled={isEdition && !!coupon?.appliedCouponsCount}
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
                      {
                        value: CouponFrequency.Forever,
                        label: translate('text_63c83a3476e46bc6ab9d85d6'),
                      },
                    ]}
                    disableClearable
                    formikProps={formikProps}
                  />

                  {formikProps.values.frequency === CouponFrequency.Forever &&
                    formikProps.values.couponType === CouponTypeEnum.FixedAmount && (
                      <Alert type="info">{translate('text_63c83a3476e46bc6ab9d85da')}</Alert>
                    )}

                  {formikProps.values.frequency === CouponFrequency.Recurring && (
                    <TextInputField
                      name="frequencyDuration"
                      beforeChangeFormatter={['positiveNumber', 'int']}
                      disabled={isEdition && !!coupon?.appliedCouponsCount}
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
                  {formikProps.values.couponType === CouponTypeEnum.FixedAmount &&
                    formikProps.values.frequency === CouponFrequency.Recurring && (
                      <Alert type="info">{translate('text_632d68358f1fedc68eed3ebd')}</Alert>
                    )}
                </Card>

                <LimitationCard $disableChildSpacing>
                  <Typography variant="subhead">
                    {translate('text_63c83d58e697e8e9236da806')}
                  </Typography>
                  <Settings>
                    <Checkbox
                      name="isReusable"
                      value={!!formikProps.values.reusable}
                      disabled={isEdition && !!coupon?.appliedCouponsCount}
                      label={translate('text_638f48274d41e3f1d01fc16a')}
                      onChange={(_, checked) => {
                        formikProps.setFieldValue('reusable', checked)
                      }}
                    />

                    <Checkbox
                      name="hasLimit"
                      value={formikProps.values.expiration === CouponExpiration.TimeLimit}
                      label={translate('text_632d68358f1fedc68eed3eb7')}
                      onChange={(_, checked) => {
                        formikProps.setFieldValue(
                          'expiration',
                          checked ? CouponExpiration.TimeLimit : CouponExpiration.NoExpiration,
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
                          name="expirationAt"
                          placement="top-end"
                          placeholder={translate('text_632d68358f1fedc68eed3ea5')}
                          formikProps={formikProps}
                        />
                      </ExpirationLine>
                    )}
                  </Settings>

                  <StyledPlanLimitCheckbox
                    name="hasPlanOrBillableMetricLimit"
                    value={hasPlanLimit || hasBillableMetricLimit}
                    disabled={isEdition && !!coupon?.appliedCouponsCount}
                    label={translate('text_64352657267c3d916f9627a4')}
                    onChange={(_, checked) => {
                      if (
                        !checked ||
                        (!limitPlansList.length && !limitBillableMetricsList.length)
                      ) {
                        setHasPlanLimit(checked)
                        setHasBillableMetricLimit(checked)
                      } else if (!!limitPlansList.length) {
                        setHasPlanLimit(checked)
                      } else if (!!limitBillableMetricsList.length) {
                        setHasBillableMetricLimit(checked)
                      }
                    }}
                  />

                  {(hasPlanLimit || hasBillableMetricLimit) && (
                    <>
                      {!!limitPlansList.length &&
                        limitPlansList.map((plan, i) => (
                          <PlanLine key={`limited-plan-${plan.id}`} data-test={`limited-plan-${i}`}>
                            <PlanLeftBlock>
                              <Avatar variant="connector">
                                <Icon name="board" />
                              </Avatar>
                              <PlanLeftBlockInfos>
                                <Typography variant="bodyHl" color="grey700">
                                  {plan.name}
                                </Typography>
                                <Typography variant="caption" color="grey600">
                                  {plan.code}
                                </Typography>
                              </PlanLeftBlockInfos>
                            </PlanLeftBlock>
                            {(!isEdition || !coupon?.appliedCouponsCount) && (
                              <Tooltip
                                placement="top-end"
                                title={translate('text_63d3a201113866a7fa5e6f6d')}
                              >
                                <Button
                                  icon="trash"
                                  variant="quaternary"
                                  size="small"
                                  onClick={() =>
                                    setLimitPlansList((oldArray: PlansForCouponsFragment[]) => [
                                      ...oldArray.filter((p) => p.id !== plan.id),
                                    ])
                                  }
                                  data-test={`delete-limited-plan-${i}`}
                                />
                              </Tooltip>
                            )}
                          </PlanLine>
                        ))}

                      {!!limitBillableMetricsList.length &&
                        limitBillableMetricsList.map((billableMetric, i) => (
                          <PlanLine
                            key={`limited-billable-metric-${billableMetric.id}`}
                            data-test={`limited-billable-metric-${i}`}
                          >
                            <PlanLeftBlock>
                              <Avatar variant="connector">
                                <Icon name="board" />
                              </Avatar>
                              <PlanLeftBlockInfos>
                                <Typography variant="bodyHl" color="grey700">
                                  {billableMetric.name}
                                </Typography>
                                <Typography variant="caption" color="grey600">
                                  {billableMetric.code}
                                </Typography>
                              </PlanLeftBlockInfos>
                            </PlanLeftBlock>
                            {(!isEdition || !coupon?.appliedCouponsCount) && (
                              <Tooltip
                                placement="top-end"
                                title={translate('text_64352657267c3d916f9627c0')}
                              >
                                <Button
                                  icon="trash"
                                  variant="quaternary"
                                  size="small"
                                  onClick={() =>
                                    setLimitBillableMetricsList(
                                      (oldArray: BillableMetricsForCouponsFragment[]) => [
                                        ...oldArray.filter((b) => b.id !== billableMetric.id),
                                      ],
                                    )
                                  }
                                  data-test={`delete-limited-billable-metric-${i}`}
                                />
                              </Tooltip>
                            )}
                          </PlanLine>
                        ))}

                      {(!isEdition || !coupon?.appliedCouponsCount) && (
                        <StyledButtonGroup>
                          <Button
                            variant="quaternary"
                            startIcon="plus"
                            disabled={hasBillableMetricLimit && !hasPlanLimit}
                            onClick={addPlanToCouponDialogRef.current?.openDialog}
                            data-test="add-plan-limit"
                          >
                            {translate('text_63d3a201113866a7fa5e6f6b')}
                          </Button>
                          <Button
                            variant="quaternary"
                            startIcon="plus"
                            disabled={hasPlanLimit && !hasBillableMetricLimit}
                            onClick={addBillableMetricToCouponDialogRef.current?.openDialog}
                            data-test="add-billable-metric-limit"
                          >
                            {translate('text_64352657267c3d916f9627bc')}
                          </Button>
                        </StyledButtonGroup>
                      )}
                    </>
                  )}
                </LimitationCard>

                <ButtonContainer>
                  <Button
                    disabled={
                      !formikProps.isValid ||
                      (isEdition &&
                        !formikProps.dirty &&
                        isEqual(coupon?.plans, limitPlansList) &&
                        isEqual(coupon?.billableMetrics, limitBillableMetricsList) &&
                        hasPlanLimit === !!coupon?.limitedPlans &&
                        hasBillableMetricLimit === !!coupon?.limitedBillableMetrics) ||
                      (hasPlanLimit && !limitPlansList.length) ||
                      (hasBillableMetricLimit && !limitBillableMetricsList.length)
                    }
                    fullWidth
                    size="large"
                    onClick={formikProps.submitForm}
                    data-test="submit"
                  >
                    {translate(
                      isEdition ? 'text_6287a9bdac160c00b2e0fc6b' : 'text_62876e85e32e0300e180317d',
                    )}
                  </Button>
                </ButtonContainer>
              </>
            )}
          </div>
        </Main>
        <Side>
          <CouponCodeSnippet
            loading={loading}
            coupon={formikProps.values}
            hasPlanLimit={hasPlanLimit}
            limitPlansList={limitPlansList}
            hasBillableMetricLimit={hasBillableMetricLimit}
            limitBillableMetricsList={limitBillableMetricsList}
          />
        </Side>
      </Content>

      <WarningDialog
        ref={warningDialogRef}
        title={translate(
          isEdition ? 'text_6287a9bdac160c00b2e0fbeb' : 'text_62876e85e32e0300e18030f5',
        )}
        description={translate(
          isEdition ? 'text_6287a9bdac160c00b2e0fbf1' : 'text_62876e85e32e0300e18030fc',
        )}
        continueText={translate(
          isEdition ? 'text_6287a9bdac160c00b2e0fbfd' : 'text_62876e85e32e0300e180310b',
        )}
        onContinue={() => navigate(COUPONS_ROUTE)}
      />

      <AddPlanToCouponDialog
        ref={addPlanToCouponDialogRef}
        onSubmit={attachPlanToCoupon}
        attachedPlansIds={limitPlansList.map((p) => p.id)}
      />

      <AddBillableMetricToCouponDialog
        ref={addBillableMetricToCouponDialogRef}
        onSubmit={attachBillableMetricToCoupon}
        attachedBillableMetricsIds={limitBillableMetricsList.map((p) => p.id)}
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

const Settings = styled.div`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(3)};
  }
`

const InlineDescription = styled.div`
  display: flex;
  align-items: center;
`

const TextArea = styled(TextInputField)`
  flex: 1;
  margin-right: ${theme.spacing(3)};
`

const CloseDescriptionTooltip = styled(Tooltip)`
  margin-top: ${theme.spacing(6)};
`

const LimitationCard = styled(Card)`
  > *:not(:last-child) {
    margin-bottom: ${theme.spacing(3)};
  }
`

const StyledPlanLimitCheckbox = styled(Checkbox)`
  margin-bottom: ${theme.spacing(3)};
`

const PlanLine = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid ${theme.palette.grey[400]};
  padding: ${theme.spacing(3)} ${theme.spacing(4)};
  border-radius: 12px;
  margin-bottom: ${theme.spacing(3)};
`
const PlanLeftBlock = styled.div`
  display: flex;
  align-items: center;
`

const PlanLeftBlockInfos = styled.div`
  margin-left: ${theme.spacing(3)};
  display: flex;
  flex-direction: column;
`

const StyledButtonGroup = styled(ButtonGroup)`
  && {
    margin-left: auto;
    align-items: initial;

    ${theme.breakpoints.down('md')} {
      margin-left: 0;
      flex-direction: column-reverse;
    }
  }
`

export default CreateCoupon
