export const feeMockFormatedForEstimate = [
  { amountCents: 1000000, feeId: 'fee1' },
  { amountCents: 1900000, feeId: 'fee2' },
  { amountCents: 50000, feeId: 'fee4' },
  { amountCents: 50000, feeId: 'fee5' },
]

export const feesMock = {
  subscriptionId1: {
    subscriptionName: 'Subscription 1',
    fees: {
      sub1feegroup1: {
        id: 'fee1',
        name: 'Fee 1',
        amount: 10000,
        taxRate: 10,
        checked: true,
        maxAmount: 10000,
        value: 10000,
        appliedTaxes: [
          {
            id: 'tax1',
            taxName: 'Tax 1',
            taxRate: 10,
          },
        ],
      },
      sub1feegroup2: {
        id: 'fee2',
        name: 'Fee 2',
        amount: 20000,
        taxRate: 20,
        checked: true,
        maxAmount: 20000,
        value: 19000,
        appliedTaxes: [
          {
            id: 'tax2',
            taxName: 'Tax 2',
            taxRate: 20,
          },
        ],
      },
      sub1feegroup3: {
        id: 'fee3',
        name: 'Fee 3',
        amount: 10,
        taxRate: 20,
        checked: false,
        maxAmount: 10,
        value: 10,
        appliedTaxes: [],
      },
    },
  },
  subscriptionId2: {
    subscriptionName: 'Subscription 2',
    fees: {
      sub2feegroup1: {
        id: 'fee4',
        name: 'Fee 4',
        amount: 4000,
        taxRate: 0,
        checked: true,
        maxAmount: 10000,
        value: 500,
      },
      sub2feegroup2: {
        name: 'Fee 5 group 1',
        grouped: {
          fee5Group1: {
            id: 'fee5',
            name: 'Fee 5',
            amount: 4000,
            taxRate: 0,
            checked: true,
            maxAmount: 10000,
            value: 500,
            appliedTaxes: [
              {
                id: 'tax1',
                taxName: 'Tax 1',
                taxRate: 10,
              },
              {
                id: 'tax2',
                taxName: 'Tax 2',
                taxRate: 20,
              },
            ],
          },
        },
      },
    },
  },
}

export const addonMockFormatedForEstimate = [
  {
    amountCents: 50000,
    feeId: 'addOnFee1',
  },
]

export const addOnFeeMock = [
  {
    id: 'addOnFee1',
    name: 'Add on fee',
    amount: 10000,
    taxRate: 30,
    checked: true,
    maxAmount: 10000,
    value: 500,
    appliedTaxes: [
      {
        id: 'tax1',
        taxName: 'Tax 1',
        taxRate: 10,
      },
      {
        id: 'tax2',
        taxName: 'Tax 2',
        taxRate: 20,
      },
    ],
  },
  {
    id: 'addOnFee2',
    name: 'Add on fee',
    amount: 20000,
    taxRate: 30,
    checked: false,
    maxAmount: 10000,
    value: 500,
    appliedTaxes: [
      {
        id: 'tax1',
        taxName: 'Tax 1',
        taxRate: 10,
      },
    ],
  },
]
