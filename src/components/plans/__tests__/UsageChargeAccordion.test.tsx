import { act, cleanup, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormikProps, useFormik } from 'formik'
import { object } from 'yup'

import { EditInvoiceDisplayNameDialogRef } from '~/components/invoices/EditInvoiceDisplayNameDialog'
import { LocalUsageChargeInput, PlanFormInput } from '~/components/plans/types'
import { UsageChargeAccordion } from '~/components/plans/UsageChargeAccordion'
import { transformFilterObjectToString } from '~/components/plans/utils'
import { MUI_BUTTON_BASE_ROOT_CLASSNAME } from '~/core/constants/form'
import getPropertyShape from '~/core/serializers/getPropertyShape'
import { chargeSchema } from '~/formValidation/chargeSchema'
import { AggregationTypeEnum, ChargeModelEnum, CurrencyEnum } from '~/generated/graphql'
import { render } from '~/test-utils'

type PrepareProps = {
  properties?: LocalUsageChargeInput['properties']
  filters?: LocalUsageChargeInput['filters']
}

async function prepare({ filters, properties }: PrepareProps = {}) {
  const UsageChargeAccordionMock = () => {
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
              filters: filters
                ? [
                    {
                      id: '1234',
                      key: 'key',
                      values: ['value'],
                    },
                  ]
                : undefined,
            },
            chargeModel: ChargeModelEnum.Standard,
            properties,
            filters,
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
      <UsageChargeAccordion
        alreadyUsedChargeAlertMessage={undefined}
        currency={CurrencyEnum.Usd}
        editInvoiceDisplayNameDialogRef={{} as React.RefObject<EditInvoiceDisplayNameDialogRef>}
        formikProps={formikProps as unknown as FormikProps<PlanFormInput>}
        id="0"
        index={0}
        isEdition={false}
      />
    )
  }

  await act(() => {
    render(<UsageChargeAccordionMock />)
  })
}
describe('UsageChargeAccordion', () => {
  afterEach(cleanup)

  describe('basic rendering with dom element assessment', () => {
    it('renders a charge with no property and no filters', async () => {
      await prepare()

      expect(screen.queryByTestId('charge-accordion-0')).toBeInTheDocument()
      expect(screen.queryByTestId('charge-model-wrapper')).toBeInTheDocument()
      expect(screen.queryByTestId('charge-0-default-property-accordion')).not.toBeInTheDocument()
      expect(
        screen.queryByTestId('default-usage-charge-accordion-without-filters'),
      ).not.toBeInTheDocument()
      expect(screen.queryByTestId('filter-charge-accordion-0')).not.toBeInTheDocument()
    })

    it('renders a charge with property but no filters', async () => {
      await prepare({ properties: getPropertyShape({}) as LocalUsageChargeInput['properties'] })

      expect(screen.queryByTestId('charge-accordion-0')).toBeInTheDocument()
      expect(screen.queryByTestId('charge-model-wrapper')).toBeInTheDocument()
      expect(screen.queryByTestId('charge-0-default-property-accordion')).not.toBeInTheDocument()
      expect(
        screen.queryByTestId('default-usage-charge-accordion-without-filters'),
      ).toBeInTheDocument()
      expect(screen.queryByTestId('filter-charge-accordion-0')).not.toBeInTheDocument()
    })

    it('renders a charge with filters but not default property', async () => {
      await prepare({
        filters: [
          {
            invoiceDisplayName: undefined,
            values: [
              transformFilterObjectToString('parent_key'),
              transformFilterObjectToString('key', 'value'),
            ],
            properties: getPropertyShape({}),
          },
        ],
      })

      expect(screen.queryByTestId('charge-accordion-0')).toBeInTheDocument()
      expect(screen.queryByTestId('charge-model-wrapper')).toBeInTheDocument()
      expect(screen.queryByTestId('charge-0-default-property-accordion')).not.toBeInTheDocument()
      expect(
        screen.queryByTestId('default-usage-charge-accordion-without-filters'),
      ).not.toBeInTheDocument()
      expect(screen.queryByTestId('filter-charge-accordion-0')).toBeInTheDocument()
      expect(screen.queryByTestId('filter-charge-accordion-1')).not.toBeInTheDocument()
    })

    it('renders a charge with property and filters', async () => {
      await prepare({
        properties: getPropertyShape({}) as LocalUsageChargeInput['properties'],
        filters: [
          {
            invoiceDisplayName: undefined,
            values: [
              transformFilterObjectToString('parent_key'),
              transformFilterObjectToString('key', 'value'),
            ],
            properties: getPropertyShape({}),
          },
        ],
      })

      expect(screen.queryByTestId('charge-accordion-0')).toBeInTheDocument()
      expect(screen.queryByTestId('charge-model-wrapper')).toBeInTheDocument()
      expect(screen.queryByTestId('charge-0-default-property-accordion')).toBeInTheDocument()
      expect(
        screen.queryByTestId('default-usage-charge-accordion-without-filters'),
      ).not.toBeInTheDocument()
      expect(screen.queryByTestId('filter-charge-accordion-0')).toBeInTheDocument()
      expect(screen.queryByTestId('filter-charge-accordion-1')).not.toBeInTheDocument()
    })

    it('hides all sub components if the accordion is closed', async () => {
      await prepare({
        properties: getPropertyShape({}) as LocalUsageChargeInput['properties'],
        filters: [
          {
            invoiceDisplayName: undefined,
            values: [
              transformFilterObjectToString('parent_key'),
              transformFilterObjectToString('key', 'value'),
            ],
            properties: getPropertyShape({}),
          },
        ],
      })

      await waitFor(() =>
        userEvent.click(
          screen
            .queryByTestId('charge-accordion-0')
            ?.querySelector(`.${MUI_BUTTON_BASE_ROOT_CLASSNAME}`) as HTMLElement,
        ),
      )

      expect(screen.queryByTestId('charge-accordion-0')).toBeInTheDocument()
      expect(screen.queryByTestId('charge-model-wrapper')).not.toBeInTheDocument()
      expect(screen.queryByTestId('default-charge-accordion-with-group')).not.toBeInTheDocument()
      expect(screen.queryByTestId('default-charge-accordion-without-group')).not.toBeInTheDocument()
      expect(screen.queryByTestId('group-charge-accordion-0')).not.toBeInTheDocument()
      expect(screen.queryByTestId('charge-with-group-actions-wrapper')).not.toBeInTheDocument()
    })
  })
})
