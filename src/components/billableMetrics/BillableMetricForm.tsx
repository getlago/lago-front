import { ReactNode } from 'react'
import { useFormik } from 'formik'
import { object, string } from 'yup'
import styled from 'styled-components'

import {
  AggregationTypeEnum,
  EditBillableMetricFragment,
  CreateBillableMetricInput,
} from '~/generated/graphql'
import { TextInputField, ComboBoxField } from '~/components/form'
import { Typography, Button } from '~/components/designSystem'
import { useI18nContext } from '~/core/I18nContext'
import { theme } from '~/styles'

interface BillableMetricFormProps {
  billableMetric?: EditBillableMetricFragment
  children?: ReactNode
  isEdition?: boolean
  onSave: (values: CreateBillableMetricInput) => Promise<void>
}

export const BillableMetricForm = ({
  billableMetric,
  children,
  isEdition,
  onSave,
}: BillableMetricFormProps) => {
  const { translate } = useI18nContext()
  const formikProps = useFormik<CreateBillableMetricInput>({
    initialValues: {
      name: billableMetric?.name ?? '',
      code: billableMetric?.code ?? '',
      description: billableMetric?.description ?? '',
      // @ts-ignore
      aggregationType: billableMetric?.aggregationType ?? '',
    },
    validationSchema: object().shape({
      name: string().required(''),
      code: string().required(''),
      aggregationType: string().required(''),
    }),
    validateOnMount: true,
    onSubmit: onSave,
  })

  return (
    <>
      <Card>
        <SectionTitle variant="subhead">{translate('text_623b42ff8ee4e000ba87d0b8')}</SectionTitle>

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
        <SectionTitle variant="subhead">{translate('text_623b42ff8ee4e000ba87d0cc')}</SectionTitle>

        <ComboBoxField
          name="aggregationType"
          disabled={isEdition && !billableMetric?.canBeDeleted}
          label={translate('text_623b42ff8ee4e000ba87d0ce')}
          infoText={translate('text_624d9adba93343010cd14c56')}
          placeholder={translate('text_623b42ff8ee4e000ba87d0d0')}
          data={[
            {
              label: translate('text_623c4a8c599213014cacc9de'),
              value: AggregationTypeEnum.CountAgg,
            },
          ]}
          helperText={
            formikProps.values?.aggregationType === AggregationTypeEnum.CountAgg
              ? translate('text_6241cc759211e600ea57f4f1')
              : undefined
          }
          formikProps={formikProps}
        />
      </Card>
      {children}
      <ButtonContainer>
        <SubmitButton
          disabled={!formikProps.isValid || (isEdition && !formikProps.dirty)}
          fullWidth
          size="large"
          onClick={formikProps.submitForm}
        >
          {translate(isEdition ? 'text_62582fb4675ece01137a7e6c' : 'text_623b42ff8ee4e000ba87d0d4')}
        </SubmitButton>
      </ButtonContainer>
    </>
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

const Card = styled.div`
  padding: ${theme.spacing(8)};
  border: 1px solid ${theme.palette.grey[300]};
  border-radius: 12px;
  box-sizing: border-box;
`

const SectionTitle = styled(Typography)`
  margin-bottom: ${theme.spacing(6)};
`

const SubmitButton = styled(Button)`
  margin-bottom: ${theme.spacing(20)};
`

const ButtonContainer = styled.div`
  margin: 0 ${theme.spacing(6)};
`
