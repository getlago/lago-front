import { gql } from '@apollo/client'
import Stack from '@mui/material/Stack'
import { revalidateLogic, useStore } from '@tanstack/react-form'
import { useEffect, useState } from 'react'
import { matchPath } from 'react-router'

import { BillableMetricCodeSnippet } from '~/components/billableMetrics/BillableMetricCodeSnippet'
import { useCustomExpressionDrawer } from '~/components/billableMetrics/customExpressionDrawer/useCustomExpressionDrawer'
import { Accordion } from '~/components/designSystem/Accordion'
import { Alert } from '~/components/designSystem/Alert'
import { Button } from '~/components/designSystem/Button'
import { Card } from '~/components/designSystem/Card'
import { Chip } from '~/components/designSystem/Chip'
import { Tooltip } from '~/components/designSystem/Tooltip'
import { Typography } from '~/components/designSystem/Typography'
import { useCentralizedDialog } from '~/components/dialogs/CentralizedDialog'
import NameAndCodeGroup from '~/components/form/NameAndCodeGroup/NameAndCodeGroup'
import { FORM_ERRORS_ENUM } from '~/core/constants/form'
import { applyExistingCodeError } from '~/core/form/existingCodeError'
import { scrollToFirstInputError } from '~/core/form/scrollToFirstInputError'
import {
  formatAggregationType,
  formatRoundingFunction,
} from '~/core/formats/formatBillableMetricsItems'
import {
  BILLABLE_METRICS_ROUTE,
  DUPLICATE_BILLABLE_METRIC_ROUTE,
  useLocation,
  useNavigate,
} from '~/core/router'
import { scrollToTop } from '~/core/utils/domUtils'
import { AggregationTypeEnum, RoundingFunctionEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useAppForm } from '~/hooks/forms/useAppform'
import { useCreateEditBillableMetric } from '~/hooks/useCreateEditBillableMetric'
import { hasRemovedFilterValues } from '~/pages/CreateBillableMetric.utils'
import {
  getAggregationTypeOptions,
  isNonRecurringOnly,
} from '~/pages/createBillableMetric/aggregationTypeOptions'
import {
  BILLABLE_METRIC_ADD_FILTER_TEST_ID,
  BILLABLE_METRIC_ADD_ROUNDING_TEST_ID,
  BILLABLE_METRIC_AGGREGATE_ON_SWITCH_TEST_ID,
  BILLABLE_METRIC_AGGREGATION_TYPE_TEST_ID,
  BILLABLE_METRIC_CODE_INPUT_TEST_ID,
  BILLABLE_METRIC_FIELD_NAME_INPUT_TEST_ID,
  BILLABLE_METRIC_FILTER_KEY_INPUT_TEST_ID,
  BILLABLE_METRIC_NAME_INPUT_TEST_ID,
  BILLABLE_METRIC_RECURRING_SWITCH_TEST_ID,
  BILLABLE_METRIC_REMOVE_ROUNDING_TEST_ID,
  BILLABLE_METRIC_ROUNDING_FUNCTION_TEST_ID,
  BILLABLE_METRIC_ROUNDING_PRECISION_TEST_ID,
  BILLABLE_METRIC_SHOW_DESCRIPTION_TEST_ID,
  BILLABLE_METRIC_SUBMIT_TEST_ID,
  FILTER_VALUE_WARNING_ALERT_TEST_ID,
  getBillableMetricFilterTestId,
} from '~/pages/createBillableMetric/billableMetricTestIds'
import { mapFromApiToForm, mapFromFormToApi } from '~/pages/createBillableMetric/mappers'
import {
  AggregateOnTab,
  aggregatesOnAField,
  billableMetricValidationSchema,
} from '~/pages/createBillableMetric/validationSchema'
import { PageHeader } from '~/styles'
import { FormLoadingSkeleton, Main, Side, Subtitle, Title } from '~/styles/mainObjectsForm'

export const BILLABLE_METRIC_FORM_ID = 'create-billable-metric-form'

gql`
  fragment EditBillableMetric on BillableMetric {
    id
    name
    code
    expression
    description
    aggregationType
    fieldName
    hasSubscriptions
    hasPlans
    recurring
    roundingFunction
    roundingPrecision
    filters {
      key
      values
    }
  }
`

const CreateBillableMetric = () => {
  const { strippedPathname } = useLocation()
  const isDuplicate = !!matchPath(DUPLICATE_BILLABLE_METRIC_ROUTE, strippedPathname)
  const { translate } = useInternationalization()
  const navigate = useNavigate()

  const { isEdition, loading, billableMetric, errorCode, onSave } = useCreateEditBillableMetric({
    isDuplicate,
  })

  const centralizedDialog = useCentralizedDialog()
  const canBeEdited =
    isDuplicate || (!billableMetric?.hasSubscriptions && !billableMetric?.hasPlans)
  // A non-duplicate edit of a metric already attached to plans/subscriptions:
  // removing filter values here can collapse existing plan charge filters.
  const isInUse = isEdition && !canBeEdited
  const defaultValues = mapFromApiToForm(billableMetric, isDuplicate)

  const form = useAppForm({
    defaultValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: billableMetricValidationSchema,
    },
    onSubmitInvalid({ formApi }) {
      scrollToFirstInputError(BILLABLE_METRIC_FORM_ID, formApi.state.errorMap.onDynamic || {})
    },
    onSubmit: async ({ value }) => {
      const input = mapFromFormToApi(value)

      // Warn before saving when the metric is in use and filter values were removed:
      // the backend collapses affected plan charge filters, which may need manual review.
      if (isInUse && hasRemovedFilterValues(billableMetric?.filters, input.filters)) {
        centralizedDialog.open({
          title: translate('text_1785937424540rcpk2gtmvcw'),
          description: translate('text_17859374245407eq5b0eujux'),
          actionText: translate('text_1785937424540njszxyvj0rx'),
          colorVariant: 'danger',
          onAction: () => onSave(input),
        })

        return
      }

      await onSave(input)
    },
  })

  const { openDrawer: openCustomExpressionDrawer } = useCustomExpressionDrawer({
    onSave: (expression) => form.setFieldValue('expression', expression),
  })

  const [shouldDisplayDescription, setShouldDisplayDescription] = useState<boolean>(
    !!billableMetric?.description,
  )
  const [shouldDisplayRounding, setShouldDisplayRounding] = useState<boolean>(
    !!billableMetric?.roundingFunction,
  )

  const isDirty = useStore(form.store, (state) => state.isDirty)
  const aggregationType = useStore(form.store, (state) => state.values.aggregationType)
  const aggregateOnTab = useStore(form.store, (state) => state.values.aggregateOnTab)
  const recurring = useStore(form.store, (state) => state.values.recurring)
  const roundingFunction = useStore(form.store, (state) => state.values.roundingFunction)
  const filters = useStore(form.store, (state) => state.values.filters)

  const showAggregateOn = aggregatesOnAField(aggregationType)
  const aggregationTypeOptions = getAggregationTypeOptions({
    recurring,
    isEdition,
    aggregationType,
    translate,
  })

  useEffect(() => {
    setShouldDisplayDescription(!!billableMetric?.description)
  }, [billableMetric?.description])

  useEffect(() => {
    setShouldDisplayRounding(!!billableMetric?.roundingFunction)
  }, [billableMetric?.roundingFunction])

  useEffect(() => {
    if (errorCode === FORM_ERRORS_ENUM.existingCode) {
      applyExistingCodeError(form)
      scrollToTop()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errorCode])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    form.handleSubmit()
  }

  return (
    <div>
      <PageHeader.Wrapper>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          {translate(isEdition ? 'text_62582fb4675ece01137a7e44' : 'text_623b42ff8ee4e000ba87d0ae')}
        </Typography>
        <Button
          variant="quaternary"
          icon="close"
          onClick={() =>
            isDirty
              ? centralizedDialog.open({
                  title: translate(
                    isEdition ? 'text_62583bbb86abcf01654f693f' : 'text_6244277fe0975300fe3fb940',
                  ),
                  description: translate(
                    isEdition ? 'text_62583bbb86abcf01654f6943' : 'text_6244277fe0975300fe3fb946',
                  ),
                  actionText: translate(
                    isEdition ? 'text_62583bbb86abcf01654f694b' : 'text_6244277fe0975300fe3fb94c',
                  ),
                  colorVariant: 'danger',
                  onAction: () => navigate(BILLABLE_METRICS_ROUTE),
                })
              : navigate(BILLABLE_METRICS_ROUTE)
          }
        />
      </PageHeader.Wrapper>
      <form
        id={BILLABLE_METRIC_FORM_ID}
        className="min-height-minus-nav flex"
        onSubmit={handleSubmit}
      >
        <Main>
          <div>
            {loading ? (
              <FormLoadingSkeleton id="create-billable-metric" length={3} />
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
                  <Typography variant="subhead1">
                    {translate('text_623b42ff8ee4e000ba87d0b8')}
                  </Typography>

                  <NameAndCodeGroup
                    form={form}
                    fields={{ name: 'name', code: 'code' }}
                    disableCodeInput={isInUse}
                    disableAutoGenerateCode={!!defaultValues.code}
                    nameDataTest={BILLABLE_METRIC_NAME_INPUT_TEST_ID}
                    codeDataTest={BILLABLE_METRIC_CODE_INPUT_TEST_ID}
                    nameProps={{
                      label: translate('text_623b42ff8ee4e000ba87d0be'),
                      placeholder: translate('text_6241cc759211e600ea57f4c7'),
                      autoFocus: true,
                    }}
                    codeProps={{
                      label: translate('text_623b42ff8ee4e000ba87d0c0'),
                      placeholder: translate('text_623b42ff8ee4e000ba87d0c4'),
                      infoText: translate('text_624d9adba93343010cd14c52'),
                    }}
                  />

                  {shouldDisplayDescription ? (
                    <div className="flex flex-row items-center gap-2">
                      <form.AppField name="description">
                        {(field) => (
                          <field.TextInputField
                            className="flex-1"
                            label={translate('text_623b42ff8ee4e000ba87d0c8')}
                            placeholder={translate('text_623b42ff8ee4e000ba87d0ca')}
                            rows="3"
                            multiline
                          />
                        )}
                      </form.AppField>

                      <Tooltip
                        className="mt-6"
                        placement="top-end"
                        title={translate('text_63aa085d28b8510cd46443ff')}
                      >
                        <Button
                          icon="trash"
                          variant="quaternary"
                          onClick={() => {
                            form.setFieldValue('description', '')
                            setShouldDisplayDescription(false)
                          }}
                        />
                      </Tooltip>
                    </div>
                  ) : (
                    <Button
                      className="self-start"
                      startIcon="plus"
                      variant="inline"
                      onClick={() => setShouldDisplayDescription(true)}
                      data-test={BILLABLE_METRIC_SHOW_DESCRIPTION_TEST_ID}
                    >
                      {translate('text_642d5eb2783a2ad10d670324')}
                    </Button>
                  )}
                </Card>
                <Card className="gap-12">
                  <Stack spacing={6}>
                    <Typography variant="subhead1">
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

                    <form.AppField
                      name="recurring"
                      listeners={{
                        onChange: () => {
                          if (isNonRecurringOnly(form.state.values.aggregationType)) {
                            form.setFieldValue('aggregationType', undefined)
                          }
                        },
                      }}
                    >
                      {(field) => (
                        <field.ButtonSelectorField
                          data-test={BILLABLE_METRIC_RECURRING_SWITCH_TEST_ID}
                          disabled={isInUse}
                          label={translate('text_64d2709dc5b465004fbd3537')}
                          helperText={translate(
                            recurring
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
                        />
                      )}
                    </form.AppField>

                    <form.AppField
                      name="aggregationType"
                      listeners={{
                        onChange: ({ value }) => {
                          if (aggregatesOnAField(value)) return

                          // The aggregate-on section is hidden for these types, so its
                          // fields would otherwise stay behind and still be submitted.
                          form.setFieldValue('fieldName', undefined)
                          form.setFieldValue('aggregateOnTab', AggregateOnTab.UniqueField)
                          form.setFieldValue('expression', '')
                        },
                      }}
                    >
                      {(field) => (
                        <field.ComboBoxField
                          dataTest={BILLABLE_METRIC_AGGREGATION_TYPE_TEST_ID}
                          sortValues={false}
                          disabled={isInUse || aggregationType === AggregationTypeEnum.CustomAgg}
                          label={
                            <div className="flex items-center gap-2">
                              <Typography variant="captionHl" color="textSecondary">
                                {translate('text_623b42ff8ee4e000ba87d0ce')}
                              </Typography>
                            </div>
                          }
                          infoText={translate('text_624d9adba93343010cd14c56')}
                          placeholder={translate('text_623b42ff8ee4e000ba87d0d0')}
                          virtualized={false}
                          data={aggregationTypeOptions}
                          helperText={
                            aggregationType
                              ? translate(formatAggregationType(aggregationType)?.helperText || '')
                              : undefined
                          }
                        />
                      )}
                    </form.AppField>

                    {showAggregateOn && (
                      <div>
                        <form.AppField name="aggregateOnTab">
                          {(field) => (
                            <field.ButtonSelectorField
                              data-test={BILLABLE_METRIC_AGGREGATE_ON_SWITCH_TEST_ID}
                              className="mb-4"
                              disabled={isInUse}
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
                            />
                          )}
                        </form.AppField>

                        {aggregateOnTab === AggregateOnTab.UniqueField && (
                          <div>
                            <form.AppField name="fieldName">
                              {(field) => (
                                <field.TextInputField
                                  data-test={BILLABLE_METRIC_FIELD_NAME_INPUT_TEST_ID}
                                  disabled={isInUse}
                                  placeholder={translate('text_1729771640162l0f5uuitglm')}
                                  helperText={translate('text_172977164016216e9fgnuf1w')}
                                />
                              )}
                            </form.AppField>
                          </div>
                        )}

                        {aggregateOnTab === AggregateOnTab.CustomExpression && (
                          <div>
                            <form.AppField name="expression">
                              {(field) => (
                                <field.JsonEditorField
                                  disabled={isInUse}
                                  readOnlyWithoutStyles
                                  editorMode="text"
                                  label=""
                                  hideLabel={true}
                                  placeholder={translate('text_1729771640162kaf49b93e20') + '\n'}
                                  onExpand={() => {
                                    openCustomExpressionDrawer({
                                      expression: form.state.values.expression,
                                      billableMetricCode: form.state.values.code,
                                      isEditable: canBeEdited,
                                    })
                                  }}
                                />
                              )}
                            </form.AppField>

                            <form.AppField name="fieldName">
                              {(field) => (
                                <field.TextInputField
                                  disabled={isInUse}
                                  className="mt-4"
                                  placeholder={translate('text_1729771640162l0f5uuitglm')}
                                  helperText={translate('text_1729771640162zvj44b3l84g')}
                                />
                              )}
                            </form.AppField>
                          </div>
                        )}
                      </div>
                    )}

                    {aggregationType === AggregationTypeEnum.WeightedSumAgg && (
                      <Alert type="info">{translate('text_650062226a33c46e8205048e')}</Alert>
                    )}
                  </Stack>

                  {!(isInUse && !billableMetric?.roundingFunction) && (
                    <div>
                      <div className="mb-6">
                        <Typography variant="subhead2" color="grey700">
                          {translate('text_1730554642648mbs3upovd2q')}
                        </Typography>

                        <Typography variant="body" color="grey600">
                          {translate('text_1730554642648xg3fknfme8w')}
                        </Typography>
                      </div>

                      {!shouldDisplayRounding && (
                        <div>
                          <Button
                            variant="inline"
                            startIcon="plus"
                            data-test={BILLABLE_METRIC_ADD_ROUNDING_TEST_ID}
                            onClick={() => setShouldDisplayRounding(true)}
                          >
                            {translate('text_173055464264877451cjmqa1')}
                          </Button>
                        </div>
                      )}

                      {shouldDisplayRounding && (
                        <div className="mb-1 flex items-center gap-4">
                          <div className="flex grow items-center gap-6">
                            <form.AppField name="roundingFunction">
                              {(field) => (
                                <field.ComboBoxField
                                  dataTest={BILLABLE_METRIC_ROUNDING_FUNCTION_TEST_ID}
                                  disabled={isInUse}
                                  disableClearable={isInUse}
                                  sortValues={false}
                                  virtualized={false}
                                  containerClassName="w-full"
                                  label={
                                    <Typography variant="body" color="grey700">
                                      {translate('text_17305547268320wyhpbm8hh0')}
                                    </Typography>
                                  }
                                  placeholder={translate('text_1730554642648npqmnqnsynd')}
                                  data={Object.values(RoundingFunctionEnum)
                                    .filter((r) => formatRoundingFunction(r))
                                    .map((roundingFunctionOption) => ({
                                      label: translate(
                                        formatRoundingFunction(roundingFunctionOption)?.label || '',
                                      ),
                                      description: translate(
                                        formatRoundingFunction(roundingFunctionOption)
                                          ?.helperText || '',
                                      ),
                                      value: roundingFunctionOption,
                                    }))}
                                />
                              )}
                            </form.AppField>

                            {roundingFunction && (
                              <form.AppField name="roundingPrecision">
                                {(field) => (
                                  <field.TextInputField
                                    data-test={BILLABLE_METRIC_ROUNDING_PRECISION_TEST_ID}
                                    type="number"
                                    disabled={isInUse}
                                    label={
                                      <Typography variant="body" color="grey700" noWrap>
                                        {translate('text_1730554726832vyn9bep4u0f')}
                                      </Typography>
                                    }
                                    placeholder="0"
                                  />
                                )}
                              </form.AppField>
                            )}
                          </div>

                          {!isInUse && (
                            <div className="flex w-7 items-center justify-center pt-6">
                              <Button
                                icon="trash"
                                variant="quaternary"
                                data-test={BILLABLE_METRIC_REMOVE_ROUNDING_TEST_ID}
                                onClick={(e) => {
                                  e.stopPropagation()

                                  setShouldDisplayRounding(false)
                                  form.setFieldValue('roundingFunction', undefined)
                                  form.setFieldValue('roundingPrecision', undefined)
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )}

                      <Typography variant="body" color="grey600">
                        {roundingFunction &&
                          translate(formatRoundingFunction(roundingFunction)?.helperText || '')}
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

                    {isInUse && (
                      <Alert type="warning" data-test={FILTER_VALUE_WARNING_ALERT_TEST_ID}>
                        {translate('text_1785937424540jyldwaxzp6s')}
                      </Alert>
                    )}

                    {filters.map((filter, filterIndex) => {
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

                                      const newFilters = [...filters]

                                      newFilters.splice(filterIndex, 1)
                                      form.setFieldValue('filters', newFilters)
                                    }}
                                  />
                                </Tooltip>
                              </Stack>
                            }
                          >
                            <Stack spacing={6}>
                              <form.AppField name={`filters[${filterIndex}].key`}>
                                {(field) => (
                                  <field.TextInputField
                                    id={`filter-key-input-${filterIndex}`}
                                    data-test={getBillableMetricFilterTestId(
                                      BILLABLE_METRIC_FILTER_KEY_INPUT_TEST_ID,
                                      filterIndex,
                                    )}
                                    label={translate('text_63fcc3218d35b9377840f5a3')}
                                    placeholder={translate('text_65e9c6d183491188fbbcf076')}
                                  />
                                )}
                              </form.AppField>

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
                                          label={value.value}
                                          deleteIconLabel={translate(
                                            'text_6261640f28a49700f1290df5',
                                          )}
                                          onDelete={() => {
                                            const newValues = [...(filter.values || [])]

                                            newValues.splice(valueIndex, 1)

                                            form.setFieldValue(
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

                              <form.AppField name={`filters[${filterIndex}].values`}>
                                {(field) => (
                                  <field.MultipleComboBoxField
                                    freeSolo
                                    hideTags
                                    disableClearable
                                    showOptionsOnlyWhenTyping
                                    data={[]}
                                    label={
                                      !filter.values?.length &&
                                      translate('text_65e9c6d183491188fbbcf078')
                                    }
                                    placeholder={translate('text_65e9c6d183491188fbbcf07a')}
                                  />
                                )}
                              </form.AppField>
                            </Stack>
                          </Accordion>
                        </div>
                      )
                    })}

                    {/* NOTE: Div used to prevent button's full width. Caused because of the Stack container */}
                    <div>
                      <Button
                        data-test={BILLABLE_METRIC_ADD_FILTER_TEST_ID}
                        variant="inline"
                        startIcon="plus"
                        onClick={() => {
                          form.setFieldValue('filters', [
                            ...filters,
                            {
                              key: '',
                              values: [],
                            },
                          ])

                          // Focus on the key input of last filter element
                          setTimeout(() => {
                            const filterKeyInputs = document.getElementById(
                              `filter-key-input-${filters.length}`,
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
                </Card>

                <div className="px-6 pb-20">
                  <form.AppForm>
                    <form.SubmitButton
                      fullWidth
                      size="large"
                      dataTest={BILLABLE_METRIC_SUBMIT_TEST_ID}
                    >
                      {translate(
                        isEdition
                          ? 'text_62582fb4675ece01137a7e6c'
                          : 'text_623b42ff8ee4e000ba87d0d4',
                      )}
                    </form.SubmitButton>
                  </form.AppForm>
                </div>
              </>
            )}
          </div>
        </Main>
        <Side>
          <form.Subscribe selector={(state) => state.values}>
            {(values) => (
              <BillableMetricCodeSnippet
                loading={loading}
                billableMetric={mapFromFormToApi(values)}
              />
            )}
          </form.Subscribe>
        </Side>
      </form>
    </div>
  )
}

export default CreateBillableMetric
