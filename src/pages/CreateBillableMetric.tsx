import { useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFormik } from 'formik'
import { bool, object, string } from 'yup'
import styled from 'styled-components'
import { gql } from '@apollo/client'

import { AggregationTypeEnum, CreateBillableMetricInput } from '~/generated/graphql'
import { PageHeader, theme, Card } from '~/styles'
import { Typography, Button, Skeleton, Accordion, Alert } from '~/components/designSystem'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import {
  TextInputField,
  ComboBoxField,
  JsonEditorField,
  ButtonSelectorField,
} from '~/components/form'
import { BILLABLE_METRICS_ROUTE } from '~/core/router'
import { WarningDialog, WarningDialogMode, WarningDialogRef } from '~/components/WarningDialog'
import { useCreateEditBillableMetric } from '~/hooks/useCreateEditBillableMetric'
import { BillableMetricCodeSnippet } from '~/components/billableMetrics/BillableMetricCodeSnippet'
import {
  Main,
  Content,
  Title,
  Subtitle,
  Side,
  Line,
  SkeletonHeader,
  ButtonContainer,
} from '~/styles/mainObjectsForm'
import { FORM_ERRORS_ENUM } from '~/core/constants/form'
import { GroupLevelEnum, determineGroupDiffLevel } from '~/core/utils/BMGroupUtils'
import {
  EditBillableMetricGroupDialog,
  EditBillableMetricGroupDialogRef,
} from '~/components/billableMetrics/EditBillableMetricGroupDialog'

gql`
  fragment EditBillableMetric on BillableMetric {
    id
    name
    code
    description
    group
    aggregationType
    fieldName
    subscriptionsCount
    plansCount
    recurring
  }
`

const CreateBillableMetric = () => {
  const { translate } = useInternationalization()
  const { isEdition, loading, billableMetric, errorCode, onSave } = useCreateEditBillableMetric()
  const warningDirtyAttributesDialogRef = useRef<WarningDialogRef>(null)
  const warningGroupEditDialogRef = useRef<EditBillableMetricGroupDialogRef>(null)
  let navigate = useNavigate()
  const formikProps = useFormik<CreateBillableMetricInput>({
    initialValues: {
      name: billableMetric?.name || '',
      code: billableMetric?.code || '',
      description: billableMetric?.description || '',
      group: JSON.stringify(billableMetric?.group || undefined, null, 2),
      // @ts-ignore
      aggregationType: billableMetric?.aggregationType || '',
      fieldName: billableMetric?.fieldName || undefined,
      recurring: billableMetric?.recurring || false,
    },
    validationSchema: object().shape({
      name: string().required(''),
      code: string().required(''),
      aggregationType: string().required(''),
      fieldName: string().when('aggregationType', {
        is: (aggregationType: AggregationTypeEnum) =>
          !!aggregationType && aggregationType !== AggregationTypeEnum.CountAgg,
        then: (schema) => schema.required(''),
      }),
      recurring: bool().required(''),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: onSave,
  })
  const canBeEdited = !billableMetric?.subscriptionsCount && !billableMetric?.plansCount

  useEffect(() => {
    if (
      formikProps.values.aggregationType === AggregationTypeEnum.CountAgg &&
      !!formikProps.values.fieldName
    ) {
      formikProps.setFieldValue('fieldName', undefined)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formikProps.values.aggregationType, formikProps.values.fieldName])

  useEffect(() => {
    if (
      ![
        AggregationTypeEnum.SumAgg,
        AggregationTypeEnum.UniqueCountAgg,
        AggregationTypeEnum.LatestAgg,
      ].includes(formikProps.values.aggregationType)
    ) {
      formikProps.setFieldValue('recurring', false)
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formikProps.values.aggregationType])

  useEffect(() => {
    if (errorCode === FORM_ERRORS_ENUM.existingCode) {
      formikProps.setFieldError('code', 'text_632a2d437e341dcc76817556')
      const rootElement = document.getElementById('root')

      if (!rootElement) return
      rootElement.scrollTo({ top: 0 })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorCode])

  return (
    <div>
      <PageHeader>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate(isEdition ? 'text_62582fb4675ece01137a7e44' : 'text_623b42ff8ee4e000ba87d0ae')}
        </Typography>
        <Button
          variant="quaternary"
          icon="close"
          onClick={() =>
            formikProps.dirty
              ? warningDirtyAttributesDialogRef.current?.openDialog()
              : navigate(BILLABLE_METRICS_ROUTE)
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
                      disabled={isEdition && !canBeEdited}
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
                    sortValues={false}
                    formikProps={formikProps}
                    name="aggregationType"
                    disabled={isEdition && !canBeEdited}
                    label={translate('text_623b42ff8ee4e000ba87d0ce')}
                    infoText={translate('text_624d9adba93343010cd14c56')}
                    placeholder={translate('text_623b42ff8ee4e000ba87d0d0')}
                    virtualized={false}
                    data={[
                      {
                        label: translate('text_623c4a8c599213014cacc9de'),
                        value: AggregationTypeEnum.CountAgg,
                      },
                      {
                        label: translate('text_62694d9181be8d00a33f20f0'),
                        value: AggregationTypeEnum.UniqueCountAgg,
                      },
                      {
                        label: translate('text_64f8823d75521b6faaee8549'),
                        value: AggregationTypeEnum.LatestAgg,
                      },
                      {
                        label: translate('text_62694d9181be8d00a33f20f8'),
                        value: AggregationTypeEnum.MaxAgg,
                      },
                      {
                        label: translate('text_62694d9181be8d00a33f2100'),
                        value: AggregationTypeEnum.SumAgg,
                      },
                    ]}
                    helperText={
                      formikProps.values?.aggregationType === AggregationTypeEnum.CountAgg
                        ? translate('text_6241cc759211e600ea57f4f1')
                        : formikProps.values?.aggregationType === AggregationTypeEnum.UniqueCountAgg
                        ? translate('text_62694d9181be8d00a33f20f6')
                        : formikProps.values?.aggregationType === AggregationTypeEnum.LatestAgg
                        ? translate('text_64f8823d75521b6faaee854b')
                        : formikProps.values?.aggregationType === AggregationTypeEnum.MaxAgg
                        ? translate('text_62694d9181be8d00a33f20f2')
                        : formikProps.values?.aggregationType === AggregationTypeEnum.SumAgg
                        ? translate('text_62694d9181be8d00a33f20ec')
                        : undefined
                    }
                  />

                  {formikProps.values?.aggregationType &&
                    formikProps.values?.aggregationType !== AggregationTypeEnum.CountAgg && (
                      <TextInputField
                        name="fieldName"
                        disabled={isEdition && !canBeEdited}
                        label={translate('text_62694d9181be8d00a33f20fe')}
                        placeholder={translate('text_62694d9181be8d00a33f2105')}
                        formikProps={formikProps}
                      />
                    )}

                  {!![AggregationTypeEnum.SumAgg, AggregationTypeEnum.UniqueCountAgg].includes(
                    formikProps.values.aggregationType
                  ) ? (
                    <>
                      <ButtonSelectorField
                        disabled={isEdition && !canBeEdited}
                        name="recurring"
                        label={translate('text_64d2709dc5b465004fbd3537')}
                        helperText={translate(
                          formikProps.values.recurring
                            ? 'text_64d27292062d9600b089aacb'
                            : 'text_64d272b4df12dc008076e232'
                        )}
                        options={[
                          {
                            label: translate('text_6310755befed49627644222b'),
                            value: false,
                          },
                          {
                            label: translate('text_64d27259d9a4cd00c1659a7e'),
                            value: true,
                          },
                        ]}
                        formikProps={formikProps}
                      />
                      <Typography variant="caption" color="grey600"></Typography>
                    </>
                  ) : !!formikProps.values.aggregationType ? (
                    <Alert type="info">{translate('text_64d27277ee75720056d78622')}</Alert>
                  ) : null}
                </Card>

                <Accordion
                  size="large"
                  summary={
                    <Typography variant="subhead" color="grey700">
                      {translate('text_633d410368cc8282af23212b')}
                    </Typography>
                  }
                >
                  <JsonEditorField
                    name="group"
                    label={translate('text_633d410368cc8282af232131')}
                    helperText={
                      <Typography
                        variant="caption"
                        color="grey600"
                        html={translate('text_633d410368cc8282af232143')}
                      />
                    }
                    placeholder={translate('text_633d410368cc8282af23213d')}
                    customInvalidError={translate('text_633b622c201ca8b521bcad59')}
                    formikProps={formikProps}
                  />

                  {errorCode === FORM_ERRORS_ENUM.invalidGroupValue && (
                    <GroupAlert type="danger">
                      <Typography
                        color="inherit"
                        html={translate('text_633d410368cc8282af23214e')}
                      />
                    </GroupAlert>
                  )}
                </Accordion>

                <ButtonContainer>
                  <Button
                    disabled={!formikProps.isValid || (isEdition && !formikProps.dirty)}
                    fullWidth
                    data-test="submit"
                    size="large"
                    onClick={async () => {
                      if (
                        (!!billableMetric?.group || !!formikProps.values.group) &&
                        (!!billableMetric?.subscriptionsCount || !!billableMetric?.plansCount) &&
                        isEdition
                      ) {
                        const groupChangeLevel = determineGroupDiffLevel(
                          billableMetric?.group,
                          formikProps?.values?.group
                        )

                        if (groupChangeLevel === GroupLevelEnum.StructuralChange) {
                          warningGroupEditDialogRef.current?.openDialog({
                            mode: WarningDialogMode.danger,
                            plansCount: billableMetric?.plansCount,
                            subscriptionsCount: billableMetric?.subscriptionsCount,
                            onContinue: async () => {
                              await formikProps.submitForm()
                            },
                          })
                          return
                        } else if (groupChangeLevel === GroupLevelEnum.AddOrRemove) {
                          warningGroupEditDialogRef.current?.openDialog({
                            mode: WarningDialogMode.info,
                            plansCount: billableMetric?.plansCount,
                            subscriptionsCount: billableMetric?.subscriptionsCount,
                            onContinue: async () => {
                              await formikProps.submitForm()
                            },
                          })
                          return
                        }
                      }
                      await formikProps.submitForm()
                    }}
                  >
                    {translate(
                      isEdition ? 'text_62582fb4675ece01137a7e6c' : 'text_623b42ff8ee4e000ba87d0d4'
                    )}
                  </Button>
                </ButtonContainer>
              </>
            )}
          </div>
        </Main>
        <Side>
          <BillableMetricCodeSnippet loading={loading} billableMetric={formikProps.values} />
        </Side>
      </Content>

      <WarningDialog
        ref={warningDirtyAttributesDialogRef}
        title={translate(
          isEdition ? 'text_62583bbb86abcf01654f693f' : 'text_6244277fe0975300fe3fb940'
        )}
        description={translate(
          isEdition ? 'text_62583bbb86abcf01654f6943' : 'text_6244277fe0975300fe3fb946'
        )}
        continueText={translate(
          isEdition ? 'text_62583bbb86abcf01654f694b' : 'text_6244277fe0975300fe3fb94c'
        )}
        onContinue={() => navigate(BILLABLE_METRICS_ROUTE)}
      />
      <EditBillableMetricGroupDialog ref={warningGroupEditDialogRef} />
    </div>
  )
}

const GroupAlert = styled(Alert)`
  margin-top: ${theme.spacing(6)};
`

export default CreateBillableMetric
