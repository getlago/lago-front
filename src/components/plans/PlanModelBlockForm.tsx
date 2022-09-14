import styled from 'styled-components'

import { theme, Card } from '~/styles'
import { Typography } from '~/components/designSystem'
import { ButtonSelector, TextInput, ComboBox, Switch } from '~/components/form'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { PlanInterval, PlanInput, CurrencyEnum } from '~/generated/graphql'

enum PlanModelBlockFormTypeEnum {
  creation = 'creation',
  edition = 'edition',
  override = 'override',
}

interface PlanModelBlockFormProps {
  title: string
  type?: keyof typeof PlanModelBlockFormTypeEnum
  values?: Omit<PlanInput, 'charges'>
  canBeDeleted?: boolean
  hasNoSubscription?: boolean
  onChange: (field: string, value: unknown) => void
}

export const PlanModelBlockForm = ({
  title,
  type = PlanModelBlockFormTypeEnum.creation,
  values,
  canBeDeleted,
  hasNoSubscription,
  onChange,
}: PlanModelBlockFormProps) => {
  const { translate } = useInternationalization()
  const isEdition = type === PlanModelBlockFormTypeEnum.edition
  const isOverride = type === PlanModelBlockFormTypeEnum.override

  return (
    <Card>
      <SectionTitle variant="subhead">{title}</SectionTitle>

      <ButtonSelector
        disabled={(isEdition && !canBeDeleted) || isOverride}
        label={translate('text_624c5eadff7db800acc4c9ad')}
        infoText={translate('text_624d9adba93343010cd14ca3')}
        value={values?.interval}
        onChange={(value) => onChange('interval', value)}
        options={[
          {
            label: translate('text_624453d52e945301380e49aa'),
            value: PlanInterval.Monthly,
          },
          {
            label: translate('text_624453d52e945301380e49ac'),
            value: PlanInterval.Yearly,
          },
          {
            label: translate('text_62b32ec6b0434070791c2d4c'),
            value: PlanInterval.Weekly,
          },
        ]}
      />

      <LineAmount>
        <TextInput
          name="amountCents"
          beforeChangeFormatter={['positiveNumber', 'decimal']}
          disabled={isEdition && !canBeDeleted}
          label={translate('text_624453d52e945301380e49b6')}
          placeholder={translate('text_624453d52e945301380e49b8')}
          value={values?.amountCents}
          onChange={(value) => onChange('amountCents', value)}
        />
        <ComboBox
          disabled={(isEdition && !canBeDeleted) || (isOverride && !hasNoSubscription)}
          name="amountCurrency"
          data={Object.values(CurrencyEnum).map((currencyType) => ({
            value: currencyType,
          }))}
          disableClearable
          value={values?.amountCurrency}
          onChange={(value) => onChange('amountCurrency', value)}
        />
      </LineAmount>

      <Switch
        name="payInAdvance"
        disabled={(isEdition && !canBeDeleted) || isOverride}
        label={translate('text_624d90e6a93343010cd14b40')}
        subLabel={translate('text_624d90e6a93343010cd14b4c')}
        checked={values?.payInAdvance}
        onChange={(value) => onChange('payInAdvance', value)}
      />

      <TextInput
        name="trialPeriod"
        disabled={isEdition && !canBeDeleted}
        label={translate('text_624453d52e945301380e49c2')}
        beforeChangeFormatter={['positiveNumber', 'decimal']}
        placeholder={translate('text_624453d52e945301380e49c4')}
        value={values?.trialPeriod || ''}
        onChange={(value) => onChange('trialPeriod', value)}
        InputProps={{
          endAdornment: (
            <InputEnd color={!canBeDeleted ? 'textPrimary' : 'textSecondary'}>
              {translate('text_624453d52e945301380e49c6')}
            </InputEnd>
          ),
        }}
      />
    </Card>
  )
}

const SectionTitle = styled(Typography)`
  > div:first-child:not(:last-child) {
    margin-bottom: ${theme.spacing(3)};
  }
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
