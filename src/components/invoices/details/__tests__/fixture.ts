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
      id: '1ff3324c-9f9b-4120-b10c-5af62774b9ff',
      charge: {
        id: '9191b741-ee76-4cae-b9e2-c34f2f0d7b15',
        filters: [],
      },
      chargeFilter: null,
    },
    {
      id: 'f435a64d-f470-4cec-97a8-52c08d665af7',
      charge: null,
      chargeFilter: null,
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
      },
      chargeFilter: {
        id: '77d0f439-1e06-4766-a754-537a8aeecf72',
      },
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
    },
  },
  fees: [
    {
      id: '824f455a-f865-4b7c-a318-d1527c488b84',
      charge: null,
      chargeFilter: null,
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
      },
      chargeFilter: {
        id: '203c0ec9-7811-4a46-8762-94504b1872ac',
      },
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
      },
      chargeFilter: {
        id: 'ababbf42-80d7-4d20-9561-c4f19ca7f9e1',
      },
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
      },
      chargeFilter: null,
    },
  ],
}
