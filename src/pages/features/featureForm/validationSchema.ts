import { z } from 'zod'

import { PrivilegeValueTypeEnum } from '~/generated/graphql'

const REQUIRED_CODE_ERROR = 'text_1771342994699klxu2paz7g9'
const REQUIRED_FIELD_ERROR = 'text_1771342994699klxu2paz7g8'

const privilegeSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  code: z.string().min(1, REQUIRED_CODE_ERROR),
  valueType: z.enum(PrivilegeValueTypeEnum),
  config: z
    .object({
      selectOptions: z.array(z.string()).optional(),
    })
    .optional(),
})

export const featureValidationSchema = z.object({
  name: z.string(),
  code: z.string().min(1, REQUIRED_CODE_ERROR),
  description: z.string(),
  privileges: z.array(privilegeSchema).check((ctx) => {
    ctx.value.forEach((privilege, index) => {
      if (privilege.valueType !== PrivilegeValueTypeEnum.Select) return
      if (privilege.config?.selectOptions !== undefined) return

      ctx.issues.push({
        code: 'custom',
        message: REQUIRED_FIELD_ERROR,
        input: privilege,
        path: [index, 'config', 'selectOptions'],
      })
    })
  }),
})

export type FeatureFormValues = z.infer<typeof featureValidationSchema>

export type FeaturePrivilegeFormValue = FeatureFormValues['privileges'][number]

export const emptyFeatureDefaultValues: FeatureFormValues = {
  name: '',
  code: '',
  description: '',
  privileges: [],
}
