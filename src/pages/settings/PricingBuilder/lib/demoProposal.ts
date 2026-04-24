// Fake proposal derived from `PriceList v26.4.1 - AI Factory (1).pdf`.
// Used for the hackathon demo so the flow runs without a live Claude call.

export type DemoProposal = {
  billable_metrics: Array<{
    code: string
    name: string
    aggregation_type: string
    field_name?: string
    recurring?: boolean
  }>
  plans: Array<{
    code: string
    name: string
    interval: string
    amount_cents: number
    amount_currency: string
    pay_in_advance?: boolean
    charges: Array<{
      billable_metric_code: string
      charge_model: string
      properties: Record<string, unknown>
    }>
  }>
  notes?: string
  ambiguities?: Array<{ item: string; question: string }>
}

export const AI_FACTORY_PROPOSAL: DemoProposal = {
  billable_metrics: [
    {
      code: 'tokens_1m',
      name: 'Tokens (1M)',
      aggregation_type: 'sum_agg',
      field_name: 'tokens',
      recurring: false,
    },
    {
      code: 'gpu_hours',
      name: 'GPU Hours',
      aggregation_type: 'sum_agg',
      field_name: 'gpu_hours',
      recurring: false,
    },
    {
      code: 'cluster_instance',
      name: 'Cluster Instance',
      aggregation_type: 'max_agg',
      field_name: 'instances',
      recurring: true,
    },
    {
      code: 'tokens_input_1m',
      name: 'Input Tokens (1M)',
      aggregation_type: 'sum_agg',
      field_name: 'input_tokens',
      recurring: false,
    },
    {
      code: 'tokens_output_1m',
      name: 'Output Tokens (1M)',
      aggregation_type: 'sum_agg',
      field_name: 'output_tokens',
      recurring: false,
    },
  ],
  plans: [
    {
      code: 'ai_studio_essential_payg',
      name: 'AI Studio - Essential (PAYG)',
      interval: 'monthly',
      amount_cents: 0,
      amount_currency: 'EUR',
      pay_in_advance: false,
      charges: [
        {
          billable_metric_code: 'tokens_input_1m',
          charge_model: 'standard',
          properties: { amount: '1.39' },
        },
        {
          billable_metric_code: 'tokens_output_1m',
          charge_model: 'standard',
          properties: { amount: '6.96' },
        },
      ],
    },
    {
      code: 'ai_studio_advanced_1y',
      name: 'AI Studio - Advanced (1-Year Subscription)',
      interval: 'monthly',
      amount_cents: 125000,
      amount_currency: 'EUR',
      pay_in_advance: true,
      charges: [
        {
          billable_metric_code: 'tokens_1m',
          charge_model: 'percentage',
          properties: { rate: '35' },
        },
      ],
    },
    {
      code: 'ai_studio_advanced_3y',
      name: 'AI Studio - Advanced (3-Year Subscription)',
      interval: 'monthly',
      amount_cents: 95000,
      amount_currency: 'EUR',
      pay_in_advance: true,
      charges: [
        {
          billable_metric_code: 'tokens_1m',
          charge_model: 'percentage',
          properties: { rate: '30' },
        },
      ],
    },
    {
      code: 'data_retriever_small',
      name: 'Data Retriever — Small (3 Node / 1TB)',
      interval: 'monthly',
      amount_cents: 39500,
      amount_currency: 'EUR',
      pay_in_advance: false,
      charges: [],
    },
    {
      code: 'data_retriever_medium',
      name: 'Data Retriever — Medium (3 Node / 3TB)',
      interval: 'monthly',
      amount_cents: 129500,
      amount_currency: 'EUR',
      pay_in_advance: false,
      charges: [],
    },
    {
      code: 'data_retriever_large',
      name: 'Data Retriever — Large (6 Node / 24TB)',
      interval: 'monthly',
      amount_cents: 945000,
      amount_currency: 'EUR',
      pay_in_advance: false,
      charges: [],
    },
    {
      code: 'data_retriever_colossus',
      name: 'Data Retriever — Colossus (9 Node / 100TB)',
      interval: 'monthly',
      amount_cents: 2750000,
      amount_currency: 'EUR',
      pay_in_advance: false,
      charges: [],
    },
    {
      code: 'elastic_inference_small_1y',
      name: 'Elastic Inference — Small (1-Year)',
      interval: 'monthly',
      amount_cents: 95000,
      amount_currency: 'EUR',
      pay_in_advance: true,
      charges: [
        {
          billable_metric_code: 'tokens_1m',
          charge_model: 'percentage',
          properties: { rate: '-20' },
        },
      ],
    },
    {
      code: 'elastic_inference_medium_1y',
      name: 'Elastic Inference — Medium (1-Year)',
      interval: 'monthly',
      amount_cents: 295000,
      amount_currency: 'EUR',
      pay_in_advance: true,
      charges: [
        {
          billable_metric_code: 'tokens_1m',
          charge_model: 'percentage',
          properties: { rate: '-30' },
        },
      ],
    },
    {
      code: 'elastic_inference_large_1y',
      name: 'Elastic Inference — Large (1-Year)',
      interval: 'monthly',
      amount_cents: 995000,
      amount_currency: 'EUR',
      pay_in_advance: true,
      charges: [
        {
          billable_metric_code: 'tokens_1m',
          charge_model: 'percentage',
          properties: { rate: '-50' },
        },
      ],
    },
    {
      code: 'dedicated_l4_gpu',
      name: 'Dedicated Inference — L4 GPU (24GB)',
      interval: 'monthly',
      amount_cents: 0,
      amount_currency: 'EUR',
      pay_in_advance: false,
      charges: [
        {
          billable_metric_code: 'gpu_hours',
          charge_model: 'standard',
          properties: { amount: '1.59' },
        },
      ],
    },
    {
      code: 'dedicated_h200_gpu',
      name: 'Dedicated Inference — H200 GPU (141GB NVLink)',
      interval: 'monthly',
      amount_cents: 0,
      amount_currency: 'EUR',
      pay_in_advance: false,
      charges: [
        {
          billable_metric_code: 'gpu_hours',
          charge_model: 'standard',
          properties: { amount: '4.94' },
        },
      ],
    },
  ],
  notes:
    'Detected three distinct pricing patterns: (1) fixed-fee subscription plans for Studio & Data Retriever SKUs, (2) percentage-of-consumption discounts for Elastic Inference tiers — modelled as negative-rate percentage charges, (3) per-GPU-hour usage for Dedicated Inference.',
  ambiguities: [
    {
      item: 'PAI-2001 (Essential PAYG)',
      question:
        '€0 base plan with per-token passthrough — should input/output rates be averaged across the model catalogue or kept as separate charges per model?',
    },
    {
      item: 'Elastic Inference discount tiers',
      question:
        'Negative percentage modelled as a charge; Lago alternatively supports coupons for this. Which fits your invoicing model better?',
    },
    {
      item: 'Embedding & Audio models (MAAS-1004 / MAAS-1001)',
      question:
        '€0 input price — skipped to avoid a $0 charge row. Confirm whether these should be modelled for reporting purposes.',
    },
  ],
}
