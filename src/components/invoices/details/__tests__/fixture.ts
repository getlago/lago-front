import { ChargeModelEnum, InvoiceSubscriptionForCreateFeeDrawerFragment } from '~/generated/graphql'

export const invoiceSubTwoChargeOneFilter: InvoiceSubscriptionForCreateFeeDrawerFragment = {
  subscription: {
    id: '0cf2e2dd-7371-4541-b04f-00f5d20f5aba',
    plan: {
      id: '203adc17-6898-4c33-948e-c2fb97d9b053',
      charges: [
        {
          id: 'c53a7a35-fa5e-407b-bf87-2b96dc1dead2',
          invoiceDisplayName: '',
          chargeModel: ChargeModelEnum.Standard,
          prorated: false,
          filters: [],
          properties: null,
          billableMetric: {
            id: 'e30d1853-461b-4107-a92a-55dd0752663a',
            name: 'Count BM',
            code: 'count_bm',
          },
        },
        {
          id: '5de3ebeb-1d6d-4aa1-8866-1fffc948224a',
          invoiceDisplayName: '',
          chargeModel: ChargeModelEnum.Standard,
          prorated: false,
          filters: [
            {
              id: 'f10c88e6-bc95-4c1e-92fe-e0f94ac66571',
              invoiceDisplayName: null,
              values: {
                payment_type: ['__ALL_FILTER_VALUES__'],
                region: ['asia'],
              },
            },
            {
              id: '77d0f439-1e06-4766-a754-537a8aeecf72',
              invoiceDisplayName: null,
              values: {
                payment_type: ['card'],
                region: ['eu', 'us'],
              },
            },
          ],
          properties: null,
          billableMetric: {
            id: '2a9dae43-b07b-4717-bf23-1b8d704d4ec5',
            name: 'bm with filters',
            code: 'bm_with_filters',
          },
        },
        {
          id: '9191b741-ee76-4cae-b9e2-c34f2f0d7b15',
          invoiceDisplayName: '',
          chargeModel: ChargeModelEnum.Standard,
          prorated: false,
          filters: [],
          properties: null,
          billableMetric: {
            id: '2020007c-1c98-4df6-90c9-747990cc988f',
            name: 'Sum BM',
            code: 'sum_bm',
          },
        },
      ],
      fixedCharges: [],
    },
  },
  fees: [
    {
      id: '1ff3324c-9f9b-4120-b10c-5af62774b9ff',
      charge: {
        id: '9191b741-ee76-4cae-b9e2-c34f2f0d7b15',
        filters: [],
        properties: null,
      },
      fixedCharge: null,
      chargeFilter: null,
      pricingUnitUsage: null,
    },
    {
      id: 'f435a64d-f470-4cec-97a8-52c08d665af7',
      charge: null,
      fixedCharge: null,
      chargeFilter: null,
      pricingUnitUsage: null,
    },
    {
      id: 'bf091d61-df22-4642-a5d5-30f814bb5b7f',
      charge: {
        id: '5de3ebeb-1d6d-4aa1-8866-1fffc948224a',
        filters: [
          {
            id: 'f10c88e6-bc95-4c1e-92fe-e0f94ac66571',
            values: {
              payment_type: ['__ALL_FILTER_VALUES__'],
              region: ['asia'],
            },
          },
          {
            id: '77d0f439-1e06-4766-a754-537a8aeecf72',
            values: {
              payment_type: ['card'],
              region: ['eu', 'us'],
            },
          },
        ],
        properties: null,
      },
      fixedCharge: null,
      chargeFilter: {
        id: '77d0f439-1e06-4766-a754-537a8aeecf72',
      },
      pricingUnitUsage: null,
    },
  ],
}

export const invoiceSubTwoChargeOneFilterDefaultAlreadySelected: InvoiceSubscriptionForCreateFeeDrawerFragment =
  {
    subscription: {
      id: '0cf2e2dd-7371-4541-b04f-00f5d20f5aba',
      plan: {
        id: '203adc17-6898-4c33-948e-c2fb97d9b053',
        charges: [
          {
            id: 'c53a7a35-fa5e-407b-bf87-2b96dc1dead2',
            invoiceDisplayName: '',
            chargeModel: ChargeModelEnum.Standard,
            prorated: false,
            filters: [],
            billableMetric: {
              id: 'e30d1853-461b-4107-a92a-55dd0752663a',
              name: 'Count BM',
              code: 'count_bm',
            },
          },
          {
            id: '5de3ebeb-1d6d-4aa1-8866-1fffc948224a',
            invoiceDisplayName: '',
            chargeModel: ChargeModelEnum.Standard,
            prorated: false,
            filters: [
              {
                id: 'f10c88e6-bc95-4c1e-92fe-e0f94ac66571',
                invoiceDisplayName: null,
                values: {
                  payment_type: ['__ALL_FILTER_VALUES__'],
                  region: ['asia'],
                },
              },
              {
                id: '77d0f439-1e06-4766-a754-537a8aeecf72',
                invoiceDisplayName: null,
                values: {
                  payment_type: ['card'],
                  region: ['eu', 'us'],
                },
              },
            ],
            billableMetric: {
              id: '2a9dae43-b07b-4717-bf23-1b8d704d4ec5',
              name: 'bm with filters',
              code: 'bm_with_filters',
            },
          },
          {
            id: '9191b741-ee76-4cae-b9e2-c34f2f0d7b15',
            invoiceDisplayName: '',
            chargeModel: ChargeModelEnum.Standard,
            prorated: false,
            filters: [],
            billableMetric: {
              id: '2020007c-1c98-4df6-90c9-747990cc988f',
              name: 'Sum BM',
              code: 'sum_bm',
            },
          },
        ],
      },
    },
    fees: [
      {
        id: '9faf3047-55f6-4465-a32a-dd871b5d7c6e',
        charge: null,
        chargeFilter: null,
      },
      {
        id: '550f45e1-f6b7-4fdf-87bb-d526938d24c4',
        charge: {
          id: '5de3ebeb-1d6d-4aa1-8866-1fffc948224a',
          filters: [
            {
              id: 'f10c88e6-bc95-4c1e-92fe-e0f94ac66571',
              values: {
                payment_type: ['__ALL_FILTER_VALUES__'],
                region: ['asia'],
              },
            },
            {
              id: '77d0f439-1e06-4766-a754-537a8aeecf72',
              values: {
                payment_type: ['card'],
                region: ['eu', 'us'],
              },
            },
          ],
        },
        chargeFilter: {
          id: '77d0f439-1e06-4766-a754-537a8aeecf72',
        },
      },
      {
        id: 'b25d4141-c21a-4ec9-8902-28c650c009bc',
        charge: {
          id: '5de3ebeb-1d6d-4aa1-8866-1fffc948224a',
          filters: [
            {
              id: 'f10c88e6-bc95-4c1e-92fe-e0f94ac66571',
              values: {
                payment_type: ['__ALL_FILTER_VALUES__'],
                region: ['asia'],
              },
            },
            {
              id: '77d0f439-1e06-4766-a754-537a8aeecf72',
              values: {
                payment_type: ['card'],
                region: ['eu', 'us'],
              },
            },
          ],
        },
        chargeFilter: null,
      },
    ],
  }

export const invoiceSubThreeChargesMultipleFilters: InvoiceSubscriptionForCreateFeeDrawerFragment =
  {
    subscription: {
      id: '0cf2e2dd-7371-4541-b04f-00f5d20f5aba',
      plan: {
        id: '203adc17-6898-4c33-948e-c2fb97d9b053',
        charges: [
          {
            id: 'c53a7a35-fa5e-407b-bf87-2b96dc1dead2',
            invoiceDisplayName: '',
            chargeModel: ChargeModelEnum.Standard,
            prorated: false,
            filters: [],
            billableMetric: {
              id: 'e30d1853-461b-4107-a92a-55dd0752663a',
              name: 'Count BM',
              code: 'count_bm',
            },
          },
          {
            id: '5de3ebeb-1d6d-4aa1-8866-1fffc948224a',
            invoiceDisplayName: '',
            chargeModel: ChargeModelEnum.Standard,
            prorated: false,
            filters: [
              {
                id: 'f10c88e6-bc95-4c1e-92fe-e0f94ac66571',
                invoiceDisplayName: null,
                values: {
                  payment_type: ['__ALL_FILTER_VALUES__'],
                  region: ['asia'],
                },
              },
              {
                id: '77d0f439-1e06-4766-a754-537a8aeecf72',
                invoiceDisplayName: null,
                values: {
                  payment_type: ['card'],
                  region: ['eu', 'us'],
                },
              },
            ],
            billableMetric: {
              id: '2a9dae43-b07b-4717-bf23-1b8d704d4ec5',
              name: 'bm with filters',
              code: 'bm_with_filters',
            },
          },
          {
            id: '9191b741-ee76-4cae-b9e2-c34f2f0d7b15',
            invoiceDisplayName: '',
            chargeModel: ChargeModelEnum.Standard,
            prorated: false,
            filters: [],
            billableMetric: {
              id: '2020007c-1c98-4df6-90c9-747990cc988f',
              name: 'Sum BM',
              code: 'sum_bm',
            },
          },
        ],
      },
    },
    fees: [
      {
        id: '8760bb62-946a-43e9-8b2b-29cc1fb26785',
        charge: null,
        chargeFilter: null,
      },
      {
        id: '03f8948e-c2ef-4227-9890-d17b96b7b747',
        charge: {
          id: '5de3ebeb-1d6d-4aa1-8866-1fffc948224a',
          filters: [
            {
              id: 'f10c88e6-bc95-4c1e-92fe-e0f94ac66571',
              values: {
                payment_type: ['__ALL_FILTER_VALUES__'],
                region: ['asia'],
              },
            },
            {
              id: '77d0f439-1e06-4766-a754-537a8aeecf72',
              values: {
                payment_type: ['card'],
                region: ['eu', 'us'],
              },
            },
          ],
        },
        chargeFilter: {
          id: '77d0f439-1e06-4766-a754-537a8aeecf72',
        },
      },
    ],
  }

export const invoiceSubAllFilterChargesSelected: InvoiceSubscriptionForCreateFeeDrawerFragment = {
  subscription: {
    id: '071e90fc-b9cb-4732-a416-06bbac7f3514',
    plan: {
      id: '234d2ce0-7107-4701-8b31-3aa5515156f0',
      charges: [
        {
          id: '332a641c-d82d-4c9e-bfbe-298b9fc2d1de',
          invoiceDisplayName: '',
          chargeModel: ChargeModelEnum.Standard,
          prorated: false,
          filters: [],
          billableMetric: {
            id: 'e30d1853-461b-4107-a92a-55dd0752663a',
            name: 'Count BM',
            code: 'count_bm',
          },
        },
        {
          id: '5b5e9402-d503-4e1f-8642-09634b2b763c',
          invoiceDisplayName: '',
          chargeModel: ChargeModelEnum.Standard,
          prorated: false,
          filters: [
            {
              id: '203c0ec9-7811-4a46-8762-94504b1872ac',
              invoiceDisplayName: null,
              values: {
                payment_type: ['__ALL_FILTER_VALUES__'],
                region: ['asia'],
              },
            },
            {
              id: 'ababbf42-80d7-4d20-9561-c4f19ca7f9e1',
              invoiceDisplayName: null,
              values: {
                payment_type: ['card'],
                region: ['eu', 'us'],
              },
            },
          ],
          billableMetric: {
            id: '2a9dae43-b07b-4717-bf23-1b8d704d4ec5',
            name: 'bm with filters',
            code: 'bm_with_filters',
          },
        },
        {
          id: '6ca2019f-af61-45e1-a58e-b616ad5615ef',
          invoiceDisplayName: '',
          chargeModel: ChargeModelEnum.Standard,
          prorated: false,
          filters: [],
          billableMetric: {
            id: '2020007c-1c98-4df6-90c9-747990cc988f',
            name: 'Sum BM',
            code: 'sum_bm',
          },
        },
      ],
      fixedCharges: [],
    },
  },
  fees: [
    {
      id: '824f455a-f865-4b7c-a318-d1527c488b84',
      charge: null,
      fixedCharge: null,
      chargeFilter: null,
      pricingUnitUsage: null,
    },
    {
      id: 'cbdb54f4-b717-4417-be10-2c2d96784199',
      charge: {
        id: '5b5e9402-d503-4e1f-8642-09634b2b763c',
        filters: [
          {
            id: '203c0ec9-7811-4a46-8762-94504b1872ac',
            values: {
              payment_type: ['__ALL_FILTER_VALUES__'],
              region: ['asia'],
            },
          },
          {
            id: 'ababbf42-80d7-4d20-9561-c4f19ca7f9e1',
            values: {
              payment_type: ['card'],
              region: ['eu', 'us'],
            },
          },
        ],
        properties: null,
      },
      fixedCharge: null,
      chargeFilter: {
        id: '203c0ec9-7811-4a46-8762-94504b1872ac',
      },
      pricingUnitUsage: null,
    },
    {
      id: 'fb479c76-56de-4335-a343-880840ccf790',
      charge: {
        id: '5b5e9402-d503-4e1f-8642-09634b2b763c',
        filters: [
          {
            id: '203c0ec9-7811-4a46-8762-94504b1872ac',
            values: {
              payment_type: ['__ALL_FILTER_VALUES__'],
              region: ['asia'],
            },
          },
          {
            id: 'ababbf42-80d7-4d20-9561-c4f19ca7f9e1',
            values: {
              payment_type: ['card'],
              region: ['eu', 'us'],
            },
          },
        ],
        properties: null,
      },
      fixedCharge: null,
      chargeFilter: {
        id: 'ababbf42-80d7-4d20-9561-c4f19ca7f9e1',
      },
      pricingUnitUsage: null,
    },
    {
      id: 'd87e44fa-3814-4c6b-a1e8-4894add44f06',
      charge: {
        id: '5b5e9402-d503-4e1f-8642-09634b2b763c',
        filters: [
          {
            id: '203c0ec9-7811-4a46-8762-94504b1872ac',
            values: {
              payment_type: ['__ALL_FILTER_VALUES__'],
              region: ['asia'],
            },
          },
          {
            id: 'ababbf42-80d7-4d20-9561-c4f19ca7f9e1',
            values: {
              payment_type: ['card'],
              region: ['eu', 'us'],
            },
          },
        ],
        properties: null,
      },
      fixedCharge: null,
      chargeFilter: null,
      pricingUnitUsage: null,
    },
  ],
}

export const invoiceSubOnlyFixedCharges: InvoiceSubscriptionForCreateFeeDrawerFragment = {
  subscription: {
    id: 'af2b4c1e-8d3a-4f9b-b5c6-12345678abcd',
    plan: {
      id: 'dc3e5f2g-9e4b-5g0c-c6d7-23456789bcde',
      charges: [],
      fixedCharges: [
        {
          id: 'fc1a2b3c-4d5e-6f7g-8h9i-0j1k2l3m4n5o',
          invoiceDisplayName: 'Setup Fee',
          addOn: {
            id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
            name: 'Onboarding Setup',
            code: 'onboarding_setup',
          },
        },
        {
          id: 'fc2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
          invoiceDisplayName: '',
          addOn: {
            id: 'b2c3d4e5-f6g7-8901-bcde-f12345678901',
            name: 'Monthly Support',
            code: 'monthly_support',
          },
        },
      ],
    },
  },
  fees: [
    {
      id: 'fee1-1234-5678-90ab-cdef12345678',
      charge: null,
      fixedCharge: {
        id: 'fc1a2b3c-4d5e-6f7g-8h9i-0j1k2l3m4n5o',
      },
      chargeFilter: null,
      pricingUnitUsage: null,
    },
  ],
}

export const invoiceSubBothChargesAndFixedCharges: InvoiceSubscriptionForCreateFeeDrawerFragment = {
  subscription: {
    id: 'bf3c5d2f-9e4a-5f0b-c6d7-34567890cdef',
    plan: {
      id: 'ed4f6g3h-0f5b-6g1c-d7e8-45678901defg',
      charges: [
        {
          id: 'd64a8a46-gb6f-5c98-cd98-3c97ed2efbe3',
          invoiceDisplayName: 'API Calls',
          chargeModel: ChargeModelEnum.Standard,
          prorated: false,
          filters: [],
          billableMetric: {
            id: 'f41e2964-572c-5218-cg34-2c9d815f5fd6',
            name: 'API Usage',
            code: 'api_usage',
          },
        },
      ],
      fixedCharges: [
        {
          id: 'fc3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
          invoiceDisplayName: '',
          addOn: {
            id: 'c3d4e5f6-g7h8-9012-cdef-123456789012',
            name: 'Premium Support',
            code: 'premium_support',
          },
        },
        {
          id: 'fc4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8r',
          invoiceDisplayName: 'License Fee',
          addOn: {
            id: 'd4e5f6g7-h8i9-0123-defg-234567890123',
            name: 'Enterprise License',
            code: 'enterprise_license',
          },
        },
      ],
    },
  },
  fees: [
    {
      id: 'fee2-2345-6789-01bc-def123456789',
      charge: {
        id: 'd64a8a46-gb6f-5c98-cd98-3c97ed2efbe3',
        filters: [],
        properties: null,
      },
      fixedCharge: null,
      chargeFilter: null,
      pricingUnitUsage: null,
    },
    {
      id: 'fee3-3456-7890-12cd-ef1234567890',
      charge: null,
      fixedCharge: {
        id: 'fc3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7q',
      },
      chargeFilter: null,
      pricingUnitUsage: null,
    },
  ],
}
