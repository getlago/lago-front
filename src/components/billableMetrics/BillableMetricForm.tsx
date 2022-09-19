import { useEffect } from 'react'
import { useFormik } from 'formik'
import { object, string } from 'yup'
import styled from 'styled-components'

import {
  AggregationTypeEnum,
  EditBillableMetricFragment,
  CreateBillableMetricInput,
} from '~/generated/graphql'
import { TextInputField, ComboBoxField } from '~/components/form'
import { Typography, Button, Skeleton } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { theme, NAV_HEIGHT, Card } from '~/styles'
import { BillableMetricCodeSnippet } from '~/components/billableMetrics/BillableMetricCodeSnippet'

interface BillableMetricFormProps {
  billableMetric?: EditBillableMetricFragment
  loading?: boolean
  isEdition?: boolean
  onSave: (values: CreateBillableMetricInput) => Promise<void>
}

enum AGGREGATION_GROUP_ENUM {
  Metered = 'metered',
  Persistent = 'persistent',
}

export const BillableMetricForm = ({
  billableMetric,
  loading,
  isEdition,
  onSave,
}: BillableMetricFormProps) => {
  const { translate } = useInternationalization()
  const formikProps = useFormik<CreateBillableMetricInput>({
    initialValues: {
      name: billableMetric?.name || '',
      code: billableMetric?.code || '',
      description: billableMetric?.description || '',
      // @ts-ignore
      aggregationType: billableMetric?.aggregationType || '',
      fieldName: billableMetric?.fieldName || undefined,
    },
    validationSchema: object().shape({
      name: string().required(''),
      code: string().required(''),
      aggregationType: string().required(''),
      fieldName: string().when('aggregationType', {
        is: (aggregationType: AggregationTypeEnum) =>
          !!aggregationType && aggregationType !== AggregationTypeEnum.CountAgg,
        then: string().required(''),
      }),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: onSave,
  })

  useEffect(() => {
    if (
      formikProps.values.aggregationType === AggregationTypeEnum.CountAgg &&
      !!formikProps.values.fieldName
    ) {
      formikProps.setFieldValue('fieldName', undefined)
    }
  }, [formikProps.values.aggregationType, formikProps.values.fieldName])

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

              {[0, 1, 2].map((skeletonCard) => (
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
                    isEdition ? 'text_62582fb4675ece01137a7e46' : 'text_623b42ff8ee4e000ba87d0b0'
                  )}
                </Title>
                <Subtitle>
                  {translate(
                    isEdition ? 'text_62582fb4675ece01137a7e48' : 'text_623b42ff8ee4e000ba87d0b4'
                  )}
                </Subtitle>
              </div>
              <Card>
                <Typography variant="subhead">
                  {translate('text_623b42ff8ee4e000ba87d0b8')}
                </Typography>

                <Line>
                  <TextInputField
                    name="name"
                    label={translate('text_623b42ff8ee4e000ba87d0be')}
                    placeholder={translate('text_6241cc759211e600ea57f4c7')}
                    // eslint-disable-next-line jsx-a11y/no-autofocus
                    autoFocus
                    formikProps={formikProps}
                  />
                  <TextInputField
                    name="code"
                    beforeChangeFormatter="code"
                    disabled={isEdition && !billableMetric?.canBeDeleted}
                    label={translate('text_623b42ff8ee4e000ba87d0c0')}
                    placeholder={translate('text_623b42ff8ee4e000ba87d0c4')}
                    formikProps={formikProps}
                    infoText={translate('text_624d9adba93343010cd14c52')}
                  />
                </Line>
                <TextInputField
                  name="description"
                  label={translate('text_623b42ff8ee4e000ba87d0c8')}
                  placeholder={translate('text_623b42ff8ee4e000ba87d0ca')}
                  rows="3"
                  multiline
                  formikProps={formikProps}
                />
              </Card>
              <Card>
                <Typography variant="subhead">
                  {translate('text_623b42ff8ee4e000ba87d0cc')}
                </Typography>

                <ComboBoxField
                  name="aggregationType"
                  disabled={isEdition && !billableMetric?.canBeDeleted}
                  label={translate('text_623b42ff8ee4e000ba87d0ce')}
                  infoText={translate('text_624d9adba93343010cd14c56')}
                  placeholder={translate('text_623b42ff8ee4e000ba87d0d0')}
                  virtualized={false}
                  data={[
                    {
                      label: translate('text_623c4a8c599213014cacc9de'),
                      value: AggregationTypeEnum.CountAgg,
                      group: AGGREGATION_GROUP_ENUM.Metered,
                    },
                    {
                      label: translate('text_62694d9181be8d00a33f20f0'),
                      value: AggregationTypeEnum.UniqueCountAgg,
                      group: AGGREGATION_GROUP_ENUM.Metered,
                    },
                    {
                      label: translate('text_62694d9181be8d00a33f20f8'),
                      value: AggregationTypeEnum.MaxAgg,
                      group: AGGREGATION_GROUP_ENUM.Metered,
                    },
                    {
                      label: translate('text_62694d9181be8d00a33f2100'),
                      value: AggregationTypeEnum.SumAgg,
                      group: AGGREGATION_GROUP_ENUM.Metered,
                    },

                    {
                      label: translate('text_63105dbdd88c7432a3b255eb'),
                      value: AggregationTypeEnum.RecurringCountAgg,
                      group: AGGREGATION_GROUP_ENUM.Persistent,
                    },
                  ]}
                  helperText={
                    formikProps.values?.aggregationType === AggregationTypeEnum.CountAgg
                      ? translate('text_6241cc759211e600ea57f4f1')
                      : formikProps.values?.aggregationType === AggregationTypeEnum.UniqueCountAgg
                      ? translate('text_62694d9181be8d00a33f20f6')
                      : formikProps.values?.aggregationType === AggregationTypeEnum.MaxAgg
                      ? translate('text_62694d9181be8d00a33f20f2')
                      : formikProps.values?.aggregationType === AggregationTypeEnum.SumAgg
                      ? translate('text_62694d9181be8d00a33f20ec')
                      : undefined
                  }
                  renderGroupHeader={{
                    [AGGREGATION_GROUP_ENUM.Metered]: (
                      <ComboboxHeader>
                        <Typography variant="captionHl" color="textSecondary">
                          {translate('text_6310755befed49627644222b')}
                        </Typography>
                        <Typography component="span" variant="caption" noWrap>
                          {translate('text_6310755befed49627644222d')}
                        </Typography>
                      </ComboboxHeader>
                    ),
                    [AGGREGATION_GROUP_ENUM.Persistent]: (
                      <ComboboxHeader>
                        <Typography variant="captionHl" color="textSecondary">
                          {translate('text_6310755befed49627644222f')}
                        </Typography>
                        <Typography component="span" variant="caption" noWrap>
                          {translate('text_6310755befed496276442231')}
                        </Typography>
                      </ComboboxHeader>
                    ),
                  }}
                  formikProps={formikProps}
                />

                {formikProps.values?.aggregationType &&
                  formikProps.values?.aggregationType !== AggregationTypeEnum.CountAgg && (
                    <TextInputField
                      name="fieldName"
                      disabled={isEdition && !billableMetric?.canBeDeleted}
                      label={translate('text_62694d9181be8d00a33f20fe')}
                      placeholder={translate('text_62694d9181be8d00a33f2105')}
                      formikProps={formikProps}
                    />
                  )}
              </Card>

              <ButtonContainer>
                <SubmitButton
                  disabled={!formikProps.isValid || (isEdition && !formikProps.dirty)}
                  fullWidth
                  data-test="submit"
                  size="large"
                  onClick={formikProps.submitForm}
                >
                  {translate(
                    isEdition ? 'text_62582fb4675ece01137a7e6c' : 'text_623b42ff8ee4e000ba87d0d4'
                  )}
                </SubmitButton>
              </ButtonContainer>
            </>
          )}
        </div>
      </Main>
      <Side>
        <BillableMetricCodeSnippet loading={loading} billableMetric={formikProps.values} />
      </Side>
    </Content>
  )
}

const Line = styled.div`
  display: flex;
  margin: -${theme.spacing(3)} -${theme.spacing(3)} ${theme.spacing(3)} -${theme.spacing(3)};
  flex-wrap: wrap;

  > * {
    flex: 1;
    margin: ${theme.spacing(3)};
    min-width: 110px;
  }
`

const SubmitButton = styled(Button)`
  margin-bottom: ${theme.spacing(20)};
`

const ButtonContainer = styled.div`
  margin: 0 ${theme.spacing(6)};
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

const Content = styled.div`
  display: flex;
`

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

const SkeletonHeader = styled.div`
  padding: 0 ${theme.spacing(8)};
`

const ComboboxHeader = styled.div`
  display: flex;
  min-width: 0;

  > * {
    white-space: nowrap;

    &:first-child {
      margin-right: ${theme.spacing(1)};
    }
    &:last-child {
      min-width: 0;
    }
  }
`
