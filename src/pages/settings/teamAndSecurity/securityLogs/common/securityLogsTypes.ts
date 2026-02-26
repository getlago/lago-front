import { GetSecurityLogsQuery } from '~/generated/graphql'

export type SecurityLogs = NonNullable<GetSecurityLogsQuery['securityLogs']>['collection']
export type SecurityLog = SecurityLogs[number]

export type SecurityLogWithId = SecurityLog & { id: string }

// Resource interfaces for type-safe access to the JSON `resources` field
export interface ApiKeyResource {
  name: string
  value_ending: string
}

export interface RotatedApiKeyResource {
  name: string
  value_ending: {
    deleted: string
    added: string
  }
}

export interface BillingEntityResource {
  billing_entity_name: string
}

export interface IntegrationResource {
  integration_name: string
}

export interface RoleResource {
  role_code: string
}

export interface InviteResource {
  invitee_email: string
}

export interface RoleEditedResource {
  email: string
  roles: {
    added: string
  }
}

export interface WebhookResource {
  webhook_url: string
}
