import { gql } from '@apollo/client'
import { Stack } from '@mui/material'
import { useFormik } from 'formik'
import _omit from 'lodash/omit'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { array, bool, number, object, string } from 'yup'

import { BillableMetricCodeSnippet } from '~/components/billableMetrics/BillableMetricCodeSnippet'
import {
  CustomExpressionDrawer,
  CustomExpressionDrawerRef,
} from '~/components/billableMetrics/CustomExpressionDrawer'
import {
  Accordion,
  Alert,
  Button,
  Chip,
  Skeleton,
  Tooltip,
  Typography,
} from '~/components/designSystem'
import {
  BasicMultipleComboBoxData,
  ButtonSelector,
  ComboBoxField,
  JsonEditorField,
  MultipleComboBox,
  TextInputField,
} from '~/components/form'
import { WarningDialog, WarningDialogRef } from '~/components/WarningDialog'
import { FORM_ERRORS_ENUM } from '~/core/constants/form'
import { BILLABLE_METRICS_ROUTE } from '~/core/router'
import {
  AggregationTypeEnum,
  CreateBillableMetricInput,
  RoundingFunctionEnum,
} from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useCreateEditBillableMetric } from '~/hooks/useCreateEditBillableMetric'
import { Card, PageHeader, theme } from '~/styles'
import {
  ButtonContainer,
  Content,
  Line,
  Main,
  Side,
  SkeletonHeader,
  Subtitle,
  Title,
} from '~/styles/mainObjectsForm'

const NOT_UNIQUE_KEY_ERROR = 'key_not_unique'

gql`
  fragment EditBillableMetric on BillableMetric {
    id
    name
    code
    expression
    description
    aggregationType
    fieldName
    subscriptionsCount
    plansCount
    recurring
    roundingFunction
    roundingPrecision
    filters {
      key
      values
    }
  }
`

enum AggregateOnTab {
  UniqueField,
  CustomExpression,
}

const TRANSLATIONS_MAP_ROUNDING_FUNCTION: Record<
  RoundingFunctionEnum,
  { label: string; description: string }
> = {
  [RoundingFunctionEnum.Round]: {
    label: 'text_1730554642648p1mngqwys8n',
    description: 'text_1730554642648qe9wjveh3fv',
  },
  [RoundingFunctionEnum.Floor]: {
    label: 'text_1730554642648f6pn2krp9sh',
    description: 'text_173055464264830liis0ojbc',
  },
  [RoundingFunctionEnum.Ceil]: {
    label: 'text_17305546426481bes2lelpqf',
    description: 'text_1730554642648grbu07mq6u3',
  },
}

const CreateBillableMetric = () => {
  const { translate } = useInternationalization()
  let navigate = useNavigate()
  const { isEdition, loading, billableMetric, errorCode, onSave } = useCreateEditBillableMetric()

  const warningDirtyAttributesDialogRef = useRef<WarningDialogRef>(null)
  const customExpressionDrawerRef = useRef<CustomExpressionDrawerRef>(null)
  const canBeEdited = !billableMetric?.subscriptionsCount && !billableMetric?.plansCount

  const formikProps = useFormik<
    CreateBillableMetricInput & {
      aggregateOnTab: AggregateOnTab
      fieldNameCustomExpression: string
    }
  >({
    initialValues: {
      name: billableMetric?.name || '',
      code: billableMetric?.code || '',
      description: billableMetric?.description || '',
      expression: billableMetric?.expression || '',
      // @ts-ignore
      aggregationType: billableMetric?.aggregationType || '',
      fieldName: billableMetric?.fieldName || undefined,
      recurring: billableMetric?.recurring || false,
      filters: billableMetric?.filters || [],
      aggregateOnTab: billableMetric?.expression
        ? AggregateOnTab.CustomExpression
        : AggregateOnTab.UniqueField,
      roundingFunction: billableMetric?.roundingFunction || undefined,
      roundingPrecision: billableMetric?.roundingPrecision || undefined,
    },
    validationSchema: object().shape({
      name: string().required(''),
      code: string().required(''),
      aggregationType: string().required(''),
      expression: string().when('aggregateOnTab', {
        is: (aggregateOnTab: AggregateOnTab) => aggregateOnTab === AggregateOnTab.CustomExpression,
        then: (schema) => schema.required(''),
      }),
      fieldName: string().when('aggregationType', {
        is: (aggregationType: AggregationTypeEnum) =>
          !!aggregationType &&
          ![AggregationTypeEnum.CountAgg, AggregationTypeEnum.CustomAgg].includes(aggregationType),
        then: (schema) => schema.required(''),
      }),
      recurring: bool().required(''),
      roundingPrecision: number(),
      filters: array()
        .of(
          object().test({
            test: function (
              value: { key?: string; values?: string[] },
              { createError, from, path },
            ) {
              // Order of validations is important here

              // Check key presence
              if (!value.key) {
                return false
              }

              // Check key uniqueness
              if (value && from && from[1] && !!from[1].value?.filters?.length) {
                const allKeys = from[1].value.filters.map((filter: { key?: string }) => filter?.key)

                if (allKeys.filter((key: string) => key === value.key).length > 1) {
                  return createError({
                    path,
                    message: NOT_UNIQUE_KEY_ERROR,
                  })
                }
              }

              // Check value presence
              if (!value.values?.length) {
                return false
              }

              return true
            },
          }),
        )
        .nullable(),
    }),
    enableReinitialize: true,
    validateOnMount: true,
    onSubmit: (values) => {
      if (values.aggregateOnTab === AggregateOnTab.CustomExpression) {
        return onSave(_omit(values, ['aggregateOnTab']))
      }

      return onSave(
        _omit(
          {
            ...values,
            expression: null,
          },
          ['aggregateOnTab'],
        ),
      )
    },
  })

  const [shouldDisplayDescription, setShouldDisplayDescription] = useState<boolean>(
    !!formikProps.initialValues.description,
  )

  const showAggregateOn =
    !!formikProps.values?.aggregationType &&
    ![AggregationTypeEnum.CountAgg, AggregationTypeEnum.CustomAgg].includes(
      formikProps.values?.aggregationType,
    )

  useEffect(() => {
    setShouldDisplayDescription(!!formikProps.initialValues.description)
  }, [formikProps.initialValues.description])

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
    if (errorCode === FORM_ERRORS_ENUM.existingCode) {
      formikProps.setFieldError('code', 'text_632a2d437e341dcc76817556')
      const rootElement = document.getElementById('root')

      if (!rootElement) return
      rootElement.scrollTo({ top: 0 })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorCode])

  const handleUpdate = (name: string, value: unknown) => {
    // Reset aggregationType if the recurring changes and is not compatible
    if (
      name === 'recurring' &&
      (formikProps.values.aggregationType === AggregationTypeEnum.CountAgg ||
        formikProps.values.aggregationType === AggregationTypeEnum.LatestAgg ||
        formikProps.values.aggregationType === AggregationTypeEnum.MaxAgg)
    ) {
      formikProps.setFieldValue('aggregationType', '')
    }

    formikProps.setFieldValue(name, value)
  }

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
                      isEdition ? 'text_62582fb4675ece01137a7e46' : 'text_623b42ff8ee4e000ba87d0b0',
                    )}
                  </Title>
                  <Subtitle>
                    {translate(
                      isEdition ? 'text_62582fb4675ece01137a7e48' : 'text_623b42ff8ee4e000ba87d0b4',
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
                  {shouldDisplayDescription ? (
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={2}
                      sx={{
                        '> *:first-child': {
                          flex: 1,
                        },
                        '> *:last-child': {
                          marginTop: theme.spacing(6),
                        },
                      }}
                    >
                      <TextInputField
                        name="description"
                        label={translate('text_623b42ff8ee4e000ba87d0c8')}
                        placeholder={translate('text_623b42ff8ee4e000ba87d0ca')}
                        rows="3"
                        multiline
                        formikProps={formikProps}
                      />

                      <Tooltip
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
                      </Tooltip>
                    </Stack>
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
                  <Stack spacing={12}>
                    <Stack spacing={6}>
                      <Typography variant="subhead">
                        {translate('text_623b42ff8ee4e000ba87d0cc')}
                      </Typography>

                      <div>
                        <Typography variant="bodyHl" color="grey700">
                          {translate('text_65e9c6d183491188fbbcf05c')}
                        </Typography>
                        <Typography variant="caption" color="grey600">
                          {translate('text_65e9c6d183491188fbbcf05e')}
                        </Typography>
                      </div>

                      <ButtonSelector
                        disabled={isEdition && !canBeEdited}
                        label={translate('text_64d2709dc5b465004fbd3537')}
                        helperText={translate(
                          formikProps.values.recurring
                            ? 'text_64d27292062d9600b089aacb'
                            : 'text_64d272b4df12dc008076e232',
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
                        value={!!formikProps.values.recurring}
                        onChange={(value) => handleUpdate('recurring', value)}
                        data-test="recurring-switch"
                      />

                      <ComboBoxField
                        sortValues={false}
                        formikProps={formikProps}
                        name="aggregationType"
                        disabled={
                          (isEdition && !canBeEdited) ||
                          formikProps.values.aggregationType === AggregationTypeEnum.CustomAgg
                        }
                        label={
                          <InlineComboboxLabel>
                            <Typography variant="captionHl" color="textSecondary">
                              {translate('text_623b42ff8ee4e000ba87d0ce')}
                            </Typography>
                          </InlineComboboxLabel>
                        }
                        infoText={translate('text_624d9adba93343010cd14c56')}
                        placeholder={translate('text_623b42ff8ee4e000ba87d0d0')}
                        virtualized={false}
                        data={[
                          ...(!formikProps.values?.recurring
                            ? [
                                {
                                  label: translate('text_623c4a8c599213014cacc9de'),
                                  value: AggregationTypeEnum.CountAgg,
                                },
                              ]
                            : []),

                          {
                            label: translate('text_62694d9181be8d00a33f20f0'),
                            value: AggregationTypeEnum.UniqueCountAgg,
                          },
                          ...(!formikProps.values?.recurring
                            ? [
                                {
                                  label: translate('text_64f8823d75521b6faaee8549'),
                                  value: AggregationTypeEnum.LatestAgg,
                                },
                                {
                                  label: translate('text_62694d9181be8d00a33f20f8'),
                                  value: AggregationTypeEnum.MaxAgg,
                                },
                              ]
                            : []),

                          {
                            label: translate('text_62694d9181be8d00a33f2100'),
                            value: AggregationTypeEnum.SumAgg,
                          },
                          {
                            labelNode: (
                              <InlineComboboxLabel>
                                <Typography variant="body" color="grey700">
                                  {translate('text_650062226a33c46e82050486')}
                                </Typography>
                              </InlineComboboxLabel>
                            ),

                            label: translate('text_650062226a33c46e82050486'),
                            value: AggregationTypeEnum.WeightedSumAgg,
                          },

                          ...(isEdition &&
                          formikProps.values?.aggregationType === AggregationTypeEnum.CustomAgg
                            ? [
                                {
                                  label: translate('text_663dea5702b60301d8d06504'),
                                  value: AggregationTypeEnum.CustomAgg,
                                },
                              ]
                            : []),
                        ]}
                        helperText={
                          formikProps.values?.aggregationType === AggregationTypeEnum.CountAgg
                            ? translate('text_6241cc759211e600ea57f4f1')
                            : formikProps.values?.aggregationType ===
                                AggregationTypeEnum.UniqueCountAgg
                              ? translate('text_62694d9181be8d00a33f20f6')
                              : formikProps.values?.aggregationType ===
                                  AggregationTypeEnum.LatestAgg
                                ? translate('text_64f8823d75521b6faaee854b')
                                : formikProps.values?.aggregationType === AggregationTypeEnum.MaxAgg
                                  ? translate('text_62694d9181be8d00a33f20f2')
                                  : formikProps.values?.aggregationType ===
                                      AggregationTypeEnum.SumAgg
                                    ? translate('text_62694d9181be8d00a33f20ec')
                                    : formikProps.values?.aggregationType ===
                                        AggregationTypeEnum.WeightedSumAgg
                                      ? translate('text_650062226a33c46e82050488')
                                      : formikProps.values?.aggregationType ===
                                          AggregationTypeEnum.CustomAgg
                                        ? translate('text_663dea5702b60301d8d0650c')
                                        : undefined
                        }
                      />

                      {showAggregateOn && (
                        <div>
                          <ButtonSelector
                            className="mb-4"
                            disabled={isEdition && !canBeEdited}
                            label={translate('text_1729771640162n696lisyg7u')}
                            options={[
                              {
                                label: translate('text_1729771640162c43hsk6e4tg'),
                                value: AggregateOnTab.UniqueField,
                              },
                              {
                                label: translate('text_1729771640162wd2k9x6mrvh'),
                                value: AggregateOnTab.CustomExpression,
                              },
                            ]}
                            value={formikProps.values.aggregateOnTab}
                            onChange={(value) => {
                              formikProps.setFieldValue('aggregateOnTab', value)
                            }}
                            data-test="aggregate-on-switch"
                          />

                          {formikProps.values.aggregateOnTab === AggregateOnTab.UniqueField && (
                            <div>
                              <TextInputField
                                name="fieldName"
                                disabled={isEdition && !canBeEdited}
                                placeholder={translate('text_1729771640162l0f5uuitglm')}
                                helperText={translate('text_172977164016216e9fgnuf1w')}
                                formikProps={formikProps}
                              />
                            </div>
                          )}

                          {formikProps.values.aggregateOnTab ===
                            AggregateOnTab.CustomExpression && (
                            <div>
                              <JsonEditorField
                                name="expression"
                                disabled={isEdition && !canBeEdited}
                                readOnlyWithoutStyles
                                editorMode="text"
                                label=""
                                hideLabel={true}
                                formikProps={formikProps}
                                placeholder={translate('text_1729771640162kaf49b93e20') + '\n'}
                                onExpand={() => {
                                  customExpressionDrawerRef?.current?.openDrawer({
                                    expression: formikProps.values.expression,
                                    billableMetricCode: formikProps.values.code,
                                    isEditable: canBeEdited,
                                  })
                                }}
                              />

                              <TextInputField
                                name="fieldName"
                                disabled={isEdition && !canBeEdited}
                                className="mt-4"
                                placeholder={translate('text_1729771640162l0f5uuitglm')}
                                helperText={translate('text_1729771640162zvj44b3l84g')}
                                formikProps={formikProps}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {formikProps.values?.aggregationType ===
                        AggregationTypeEnum.WeightedSumAgg && (
                        <Alert type="info">{translate('text_650062226a33c46e8205048e')}</Alert>
                      )}
                    </Stack>

                    {!(isEdition && !canBeEdited && !billableMetric?.roundingFunction) && (
                      <div>
                        <div className="mb-6">
                          <Typography className="text-base font-medium text-grey-700">
                            {translate('text_1730554642648mbs3upovd2q')}
                          </Typography>

                          <Typography className="text-sm font-normal leading-6 text-grey-600">
                            {translate('text_1730554642648xg3fknfme8w')}
                          </Typography>
                        </div>

                        {formikProps.values.roundingFunction === undefined && (
                          <div>
                            <Button
                              variant="quaternary"
                              startIcon="plus"
                              onClick={() => {
                                formikProps.setFieldValue('roundingFunction', null)
                              }}
                            >
                              {translate('text_173055464264877451cjmqa1')}
                            </Button>
                          </div>
                        )}

                        {(formikProps.values.roundingFunction ||
                          formikProps.values.roundingFunction === null) && (
                          <div className="mb-1 flex items-center gap-4">
                            <div className="flex grow items-center gap-6">
                              <ComboBoxField
                                name="roundingFunction"
                                formikProps={formikProps}
                                disabled={isEdition && !canBeEdited}
                                disableClearable={isEdition && !canBeEdited}
                                sortValues={false}
                                virtualized={false}
                                containerClassName="w-full"
                                label={
                                  <Typography className="text-sm font-medium text-grey-700">
                                    {translate('text_17305547268320wyhpbm8hh0')}
                                  </Typography>
                                }
                                placeholder={translate('text_1730554642648npqmnqnsynd')}
                                data={Object.values(RoundingFunctionEnum)
                                  .filter(
                                    (roundingFunction) =>
                                      !!TRANSLATIONS_MAP_ROUNDING_FUNCTION[roundingFunction],
                                  )
                                  .map((roundingFunction) => ({
                                    label: translate(
                                      TRANSLATIONS_MAP_ROUNDING_FUNCTION[roundingFunction].label,
                                    ),
                                    description: translate(
                                      TRANSLATIONS_MAP_ROUNDING_FUNCTION[roundingFunction]
                                        .description,
                                    ),
                                    value: roundingFunction,
                                  }))}
                              />

                              {formikProps.values.roundingFunction && (
                                <TextInputField
                                  name="roundingPrecision"
                                  type="number"
                                  disabled={isEdition && !canBeEdited}
                                  label={
                                    <Typography className="whitespace-nowrap text-sm font-medium text-grey-700">
                                      {translate('text_1730554726832vyn9bep4u0f')}
                                    </Typography>
                                  }
                                  placeholder="0"
                                  formikProps={formikProps}
                                />
                              )}
                            </div>

                            {!(isEdition && !canBeEdited) && (
                              <div className="flex w-7 items-center justify-center pt-6">
                                <Button
                                  icon="trash"
                                  variant="quaternary"
                                  onClick={(e) => {
                                    e.stopPropagation()

                                    formikProps.setFieldValue('roundingFunction', undefined)
                                    formikProps.setFieldValue('roundingPrecision', undefined)
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        )}

                        <Typography className="text-sm font-normal text-grey-600">
                          {formikProps.values.roundingFunction &&
                            translate(
                              TRANSLATIONS_MAP_ROUNDING_FUNCTION[
                                formikProps.values.roundingFunction
                              ].description,
                            )}
                        </Typography>
                      </div>
                    )}

                    <Stack spacing={6}>
                      <div>
                        <Typography variant="bodyHl" color="grey700">
                          {translate('text_65e9c6d183491188fbbcf06c')}
                        </Typography>
                        <Typography variant="caption" color="grey600">
                          {translate('text_65e9c6d183491188fbbcf06e')}
                        </Typography>
                      </div>

                      {formikProps.values.filters?.map((filter, filterIndex) => {
                        return (
                          <div key={`filter-${filterIndex}`}>
                            {/* NOTE: Div above is used to prevent Accordion margin reset when expended. Caused because of the Stack container */}
                            <Accordion
                              initiallyOpen={!isEdition || (!filter.key && !filter.values.length)}
                              summary={
                                <Stack
                                  direction="row"
                                  alignItems="center"
                                  spacing={3}
                                  sx={{
                                    flex: 1,

                                    '> *:first-child': {
                                      flex: 1,
                                    },
                                  }}
                                >
                                  <div>
                                    <Typography variant="bodyHl" color="grey700">
                                      {filter.key || translate('text_65e9c6d183491188fbbcf070')}
                                    </Typography>
                                    <Typography variant="caption" color="grey600">
                                      {translate(
                                        'text_65e9c6d183491188fbbcf072',
                                        {
                                          count: filter.values.length || 0,
                                        },
                                        filter.values.length || 0,
                                      )}
                                    </Typography>
                                  </div>

                                  <Tooltip
                                    placement="top-end"
                                    title={translate('text_63aa085d28b8510cd46443ff')}
                                  >
                                    <Button
                                      icon="trash"
                                      variant="quaternary"
                                      onClick={(e) => {
                                        e.stopPropagation()

                                        const newFilters = [...(formikProps.values.filters || [])]

                                        newFilters.splice(filterIndex, 1)
                                        formikProps.setFieldValue('filters', newFilters)
                                      }}
                                    />
                                  </Tooltip>
                                </Stack>
                              }
                            >
                              <Stack spacing={6}>
                                <TextInputField
                                  id={`filter-key-input-${filterIndex}`}
                                  name={`filters[${filterIndex}].key`}
                                  label={translate('text_63fcc3218d35b9377840f5a3')}
                                  placeholder={translate('text_65e9c6d183491188fbbcf076')}
                                  formikProps={formikProps}
                                  error={
                                    formikProps.errors.filters?.[filterIndex] ===
                                    NOT_UNIQUE_KEY_ERROR
                                      ? translate('text_65eadc457f316200770db19c')
                                      : undefined
                                  }
                                />

                                {!!filter.values?.length && (
                                  <Stack gap={1}>
                                    <Typography variant="captionHl" color="grey700">
                                      {translate('text_65e9c6d183491188fbbcf078')}
                                    </Typography>
                                    <Stack direction="row" gap={2} flexWrap="wrap">
                                      {filter.values?.map((value, valueIndex) => {
                                        return (
                                          <Chip
                                            key={`filter-${filterIndex}-value-${valueIndex}`}
                                            label={value}
                                            deleteIconLabel={translate(
                                              'text_6261640f28a49700f1290df5',
                                            )}
                                            onDelete={() => {
                                              const newValues = [
                                                ...(formikProps.values.filters?.[filterIndex]
                                                  ?.values || []),
                                              ]

                                              newValues.splice(valueIndex, 1)

                                              formikProps.setFieldValue(
                                                `filters[${filterIndex}].values`,
                                                newValues,
                                              )
                                            }}
                                          />
                                        )
                                      })}
                                    </Stack>
                                  </Stack>
                                )}

                                <MultipleComboBox
                                  freeSolo
                                  hideTags
                                  disableClearable
                                  showOptionsOnlyWhenTyping
                                  data={[]}
                                  label={
                                    !formikProps.values.filters?.[filterIndex]?.values?.length &&
                                    translate('text_65e9c6d183491188fbbcf078')
                                  }
                                  value={
                                    formikProps.values.filters?.[filterIndex]?.values?.map(
                                      (value) => {
                                        return {
                                          value,
                                        }
                                      },
                                    ) || []
                                  }
                                  onChange={(values) => {
                                    formikProps.setFieldValue(
                                      `filters[${filterIndex}].values`,
                                      values.map((value) => {
                                        return (value as BasicMultipleComboBoxData).value
                                      }),
                                    )
                                  }}
                                  placeholder={translate('text_65e9c6d183491188fbbcf07a')}
                                />
                              </Stack>
                            </Accordion>
                          </div>
                        )
                      })}

                      {/* NOTE: Div used to prevent button's full width. Caused because of the Stack container */}
                      <div>
                        <Button
                          variant="quaternary"
                          startIcon="plus"
                          onClick={() => {
                            formikProps.setFieldValue('filters', [
                              ...(formikProps.values.filters || []),
                              {
                                key: '',
                                values: [],
                              },
                            ])

                            // Focus on the key input of last filter element
                            setTimeout(() => {
                              const filterKeyInputs = document.getElementById(
                                `filter-key-input-${formikProps.values.filters?.length}`,
                              )

                              if (filterKeyInputs) {
                                filterKeyInputs.focus()
                              }
                            }, 0)
                          }}
                        >
                          {translate('text_65e9c6d183491188fbbcf07c')}
                        </Button>
                      </div>
                    </Stack>
                  </Stack>
                </Card>

                <ButtonContainer>
                  <Button
                    disabled={!formikProps.isValid || (isEdition && !formikProps.dirty)}
                    fullWidth
                    data-test="submit"
                    size="large"
                    onClick={formikProps.submitForm}
                  >
                    {translate(
                      isEdition ? 'text_62582fb4675ece01137a7e6c' : 'text_623b42ff8ee4e000ba87d0d4',
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

      <CustomExpressionDrawer
        ref={customExpressionDrawerRef}
        onSave={(expression: string) => formikProps.setFieldValue('expression', expression)}
      />

      <WarningDialog
        ref={warningDirtyAttributesDialogRef}
        title={translate(
          isEdition ? 'text_62583bbb86abcf01654f693f' : 'text_6244277fe0975300fe3fb940',
        )}
        description={translate(
          isEdition ? 'text_62583bbb86abcf01654f6943' : 'text_6244277fe0975300fe3fb946',
        )}
        continueText={translate(
          isEdition ? 'text_62583bbb86abcf01654f694b' : 'text_6244277fe0975300fe3fb94c',
        )}
        onContinue={() => navigate(BILLABLE_METRICS_ROUTE)}
      />
    </div>
  )
}

const InlineComboboxLabel = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing(2)};
`

export default CreateBillableMetric
