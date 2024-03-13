import { act, cleanup, screen } from '@testing-library/react'
import { FormikProps, useFormik } from 'formik'
import { object } from 'yup'

import { EditInvoiceDisplayNameRef } from '~/components/invoices/EditInvoiceDisplayName'
import getPropertyShape from '~/core/serializers/getPropertyShape'
import { chargeSchema } from '~/formValidation/chargeSchema'
import { AggregationTypeEnum, ChargeModelEnum, CurrencyEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

import { ChargeAccordion } from '../ChargeAccordion'
import { LocalChargeInput, PlanFormInput } from '../types'

type PrepareProps = {
  properties?: LocalChargeInput['properties']
}

async function prepare({ properties }: PrepareProps = {}) {
  const ChargeAccordionMock = () => {
    const formikProps = useFormik<Pick<PlanFormInput, 'charges'>>({
      initialValues: {
        charges: [
          {
            billableMetric: {
              id: '1234',
              name: 'bm1',
              code: 'bm1',
              aggregationType: AggregationTypeEnum.CountAgg,
              recurring: false,
            },
            chargeModel: ChargeModelEnum.Standard,
            properties,
          },
        ],
      },
      validationSchema: object().shape({
        charges: chargeSchema,
      }),
      enableReinitialize: true,
      validateOnMount: true,
      onSubmit: () => {},
    })

    return (
      <ChargeAccordion
        id="0"
        index={0}
        currency={CurrencyEnum.Usd}
        shouldDisplayAlreadyUsedChargeAlert={false}
        formikProps={formikProps as unknown as FormikProps<PlanFormInput>}
        editInvoiceDisplayNameRef={{} as React.RefObject<EditInvoiceDisplayNameRef>}
      />
    )
  }

  await act(() => {
    render(<ChargeAccordionMock />)
  })
}
describe('ChargeAccordion', () => {
  afterEach(cleanup)

  describe('basic rendering with dom element assessment', () => {
    it('renders a charge with no property and no groupProperties', async () => {
      await prepare()

      expect(screen.queryByTestId('charge-accordion-0')).toBeInTheDocument()
      expect(screen.queryByTestId('charge-model-wrapper')).toBeInTheDocument()
      expect(screen.queryByTestId('default-charge-accordion-with-group')).not.toBeInTheDocument()
      expect(screen.queryByTestId('default-charge-accordion-without-group')).not.toBeInTheDocument()
      expect(screen.queryByTestId('group-charge-accordion-0')).not.toBeInTheDocument()
      expect(screen.queryByTestId('charge-with-group-actions-wrapper')).not.toBeInTheDocument()
    })

    it('renders a charge with property but no groupProperties', async () => {
      await prepare({ properties: getPropertyShape({}) as LocalChargeInput['properties'] })

      expect(screen.queryByTestId('charge-accordion-0')).toBeInTheDocument()
      expect(screen.queryByTestId('charge-model-wrapper')).toBeInTheDocument()
      expect(screen.queryByTestId('default-charge-accordion-with-group')).not.toBeInTheDocument()
      expect(screen.queryByTestId('default-charge-accordion-without-group')).toBeInTheDocument()
      expect(screen.queryByTestId('group-charge-accordion-0')).not.toBeInTheDocument()
      expect(screen.queryByTestId('charge-with-group-actions-wrapper')).not.toBeInTheDocument()
    })

    it('TODO: renders a charge with group property but no filters', async () => {})

    it('TODO: renders a charge with property and filters', async () => {})

    it('hides all sub components if the accordion is closed', async () => {
      await prepare({
        properties: getPropertyShape({}) as LocalChargeInput['properties'],
        // TODO: add filters here
      })
    })
  })
})
