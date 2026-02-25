import { GetSecurityLogsQuery } from '~/generated/graphql'

export type SecurityLogs = NonNullable<GetSecurityLogsQuery['securityLogs']>['collection']
export type SecurityLog = SecurityLogs[number]

export type SecurityLogWithId = SecurityLog & { id: string }
