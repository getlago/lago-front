import { z } from 'zod'

import {
  getX402Families,
  isValidAllowedOrigin,
  MAX_ALLOWED_ORIGINS,
  parseAllowedOrigins,
  X402FamilyEnum,
} from '~/components/settings/integrations/x402Connection'

export const REQUIRED_ERROR = 'text_624ea7c29103fd010732ab7d'
export const TOO_MANY_ORIGINS_ERROR = 'text_1793132394870tuaiztlruvj'
export const INVALID_ORIGIN_ERROR = 'text_179313239487018bzfrus7nt'

export const x402ValidationSchema = z
  .object({
    isEdition: z.boolean(),
    name: z.string().min(1, { message: REQUIRED_ERROR }),
    code: z.string().min(1, { message: REQUIRED_ERROR }),
    cdpApiKeyId: z.string(),
    cdpApiKeySecret: z.string(),
    environment: z.string().min(1, { message: REQUIRED_ERROR }),
    networks: z
      .array(z.object({ value: z.string(), label: z.string().optional() }))
      .min(1, { message: REQUIRED_ERROR }),
    evmPayoutAddress: z.string(),
    svmPayoutAddress: z.string(),
    allowedOrigins: z.string(),
    autoCreateCustomers: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const families = getX402Families(values.networks.map(({ value }) => value))
    const origins = parseAllowedOrigins(values.allowedOrigins)

    if (!values.isEdition && !values.cdpApiKeyId) {
      ctx.addIssue({ code: 'custom', message: REQUIRED_ERROR, path: ['cdpApiKeyId'] })
    }

    if (!values.isEdition && !values.cdpApiKeySecret) {
      ctx.addIssue({ code: 'custom', message: REQUIRED_ERROR, path: ['cdpApiKeySecret'] })
    }

    if (families.includes(X402FamilyEnum.Evm) && !values.evmPayoutAddress) {
      ctx.addIssue({ code: 'custom', message: REQUIRED_ERROR, path: ['evmPayoutAddress'] })
    }

    if (families.includes(X402FamilyEnum.Svm) && !values.svmPayoutAddress) {
      ctx.addIssue({ code: 'custom', message: REQUIRED_ERROR, path: ['svmPayoutAddress'] })
    }

    if (!origins.length) {
      ctx.addIssue({ code: 'custom', message: REQUIRED_ERROR, path: ['allowedOrigins'] })
    } else if (origins.length > MAX_ALLOWED_ORIGINS) {
      ctx.addIssue({ code: 'custom', message: TOO_MANY_ORIGINS_ERROR, path: ['allowedOrigins'] })
    } else if (!origins.every(isValidAllowedOrigin)) {
      ctx.addIssue({ code: 'custom', message: INVALID_ORIGIN_ERROR, path: ['allowedOrigins'] })
    }
  })

export type X402FormValues = z.infer<typeof x402ValidationSchema>

export const x402DefaultValues: X402FormValues = {
  isEdition: false,
  name: '',
  code: '',
  cdpApiKeyId: '',
  cdpApiKeySecret: '',
  environment: '',
  networks: [],
  evmPayoutAddress: '',
  svmPayoutAddress: '',
  allowedOrigins: '',
  autoCreateCustomers: true,
}
