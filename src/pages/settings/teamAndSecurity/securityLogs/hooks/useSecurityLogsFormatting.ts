import { DateFormat, TimeFormat } from '~/core/timezone'
import { LogEventEnum, LogTypeEnum } from '~/generated/graphql'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { useOrganizationInfos } from '~/hooks/useOrganizationInfos'

import { SecurityLogWithId } from '../common/securityLogsTypes'

export const useSecurityLogsFormatting = () => {
  const { translate } = useInternationalization()
  const { intlFormatDateTimeOrgaTZ } = useOrganizationInfos()

  const getFormattedLogEvent = (logEvent: LogEventEnum) => {
    const logTypes = Object.values(LogTypeEnum).sort((a, b) => b.length - a.length)

    for (const logType of logTypes) {
      const prefix = `${logType}_`

      if (logEvent.startsWith(prefix)) {
        return `${logType}.${logEvent.slice(prefix.length)}`
      }
    }

    return logEvent
  }

  const getApiKeyResources = (securityLog: SecurityLogWithId) => {
    if (
      !securityLog.resources &&
      !('name' in securityLog.resources) &&
      typeof securityLog.resources.name !== 'string' &&
      !('value_ending' in securityLog.resources) &&
      typeof securityLog.resources.value_ending !== 'string'
    )
      return {
        apiKeyName: 'unknown',
        lastFour: 'XXXX',
      }

    return {
      apiKeyName: securityLog.resources.name,
      lastFour: securityLog.resources.value_ending,
    }
  }

  const getRotatedApiKeyResources = (securityLog: SecurityLogWithId) => {
    if (
      !securityLog.resources &&
      !('name' in securityLog.resources) &&
      typeof securityLog.resources.name !== 'string' &&
      !('value_ending' in securityLog.resources) &&
      typeof securityLog.resources.value_ending !== 'object' &&
      !('deleted' in securityLog.resources.value_ending) &&
      !('added' in securityLog.resources.value_ending) &&
      typeof securityLog.resources.value_ending.deleted !== 'string' &&
      typeof securityLog.resources.value_ending.added !== 'string'
    )
      return {
        apiKeyName: 'unknown',
        lastFourFrom: 'XXXX',
        lastFourTo: 'XXXX',
      }

    return {
      apiKeyName: securityLog.resources.name,
      lastFourFrom: securityLog.resources.value_ending.deleted,
      lastFourTo: securityLog.resources.value_ending.added,
    }
  }

  const getBillingEntityResources = (securityLog: SecurityLogWithId) => {
    if (
      !securityLog.resources &&
      !('billing_entity_name' in securityLog.resources) &&
      typeof securityLog.resources.billing_entity_name !== 'string'
    )
      return {
        email: securityLog.userEmail,
        billingEntityName: 'unknown',
      }

    return {
      email: securityLog.userEmail,
      billingEntityName: securityLog.resources.billing_entity_name,
    }
  }

  const getIntegrationsResources = (securityLog: SecurityLogWithId) => {
    if (
      !securityLog.resources &&
      !('integration_name' in securityLog.resources) &&
      typeof securityLog.resources.integration_name !== 'string'
    )
      return {
        email: securityLog.userEmail,
        integrationName: 'unknown',
      }

    return {
      email: securityLog.userEmail,
      integrationName: securityLog.resources.integration_name,
    }
  }

  const getRoleResources = (securityLog: SecurityLogWithId) => {
    if (
      !securityLog.resources &&
      !('role_code' in securityLog.resources) &&
      typeof securityLog.resources.role_code !== 'string'
    )
      return {
        email: securityLog.userEmail,
        role: 'unknown',
      }

    return {
      email: securityLog.userEmail,
      role: securityLog.resources.role_code,
    }
  }

  const getInviteResources = (securityLog: SecurityLogWithId) => {
    if (
      !securityLog.resources &&
      !('invitee_email' in securityLog.resources) &&
      typeof securityLog.resources.invitee_email !== 'string'
    )
      return {
        emailInviter: securityLog.userEmail,
        emailInvitee: 'unknown',
      }

    return {
      emailInviter: securityLog.userEmail,
      emailInvitee: securityLog.resources.invitee_email,
    }
  }

  const getRoleEditedResources = (securityLog: SecurityLogWithId) => {
    if (
      !securityLog.resources &&
      !('email' in securityLog.resources) &&
      typeof securityLog.resources.email !== 'string' &&
      typeof securityLog.resources.roles !== 'object' &&
      !('added' in securityLog.resources.roles) &&
      typeof securityLog.resources.roles.added !== 'string'
    )
      return {
        emailUpdated: 'unknown',
        role: 'unknown',
        emailUpdater: securityLog.userEmail,
      }

    return {
      emailUpdated: securityLog.resources.email,
      role: securityLog.resources.roles.added,
      emailUpdater: securityLog.userEmail,
    }
  }

  const getWebhookResources = (securityLog: SecurityLogWithId) => {
    if (
      !securityLog.resources &&
      !('webhook_url' in securityLog.resources) &&
      typeof securityLog.resources.webhook_url !== 'string'
    )
      return {
        url: 'unknown',
      }

    return {
      url: securityLog.resources.webhook_url,
    }
  }

  const getSecurityLogDescription = (securityLog: SecurityLogWithId) => {
    switch (securityLog.logEvent) {
      case LogEventEnum.ApiKeyCreated:
        return translate('text_1771937987061yugieyprq64', getApiKeyResources(securityLog))
      case LogEventEnum.ApiKeyDeleted:
        return translate('text_1771937987062c4wpkhw85ur', getApiKeyResources(securityLog))
      case LogEventEnum.ApiKeyRotated:
        return translate('text_1771937987062j5wceattpsk', getRotatedApiKeyResources(securityLog))
      case LogEventEnum.ApiKeyUpdated:
        return translate('text_17719379870627ay1unhe3sc', getApiKeyResources(securityLog))
      case LogEventEnum.BillingEntityCreated:
        return translate('text_1771937987062m168k1ib517', getBillingEntityResources(securityLog))
      case LogEventEnum.BillingEntityUpdated:
        return translate('text_1771937987062jvw6fuaozy6', getBillingEntityResources(securityLog))
      case LogEventEnum.ExportCreated:
        return translate('text_17719379870627ei3dm7ewsz', {
          email: securityLog.userEmail,
        })
      case LogEventEnum.IntegrationCreated:
        return translate('text_1771937987062d55u36jsdpr', getIntegrationsResources(securityLog))
      case LogEventEnum.IntegrationDeleted:
        return translate('text_1771937987062a3v2gpxuc0r', getIntegrationsResources(securityLog))
      case LogEventEnum.IntegrationUpdated:
        return translate('text_1771937987062w21v4p2bnf8', getIntegrationsResources(securityLog))
      case LogEventEnum.RoleCreated:
        return translate('text_17719379870626yw59p9eb05', getRoleResources(securityLog))
      case LogEventEnum.RoleDeleted:
        return translate('text_1771937987062w0rqek89vln', getRoleResources(securityLog))
      case LogEventEnum.RoleUpdated:
        return translate('text_17719379870621tc4rrbq2q1', getRoleResources(securityLog))
      case LogEventEnum.UserDeleted:
        return translate('text_1771937987062gcohii3uw0b', {
          email: securityLog.userEmail,
        })
      case LogEventEnum.UserInvited:
        return translate('text_1771937987062y18loukkg7e', getInviteResources(securityLog))
      case LogEventEnum.UserPasswordEdited:
        return translate('text_1771937987062gk7g578r4jp', {
          email: securityLog.userEmail,
        })
      case LogEventEnum.UserPasswordResetRequested:
        return translate('text_1771937987062l3bixv068cp', {
          email: securityLog.userEmail,
        })
      case LogEventEnum.UserRoleEdited:
        return translate('text_1771937987062894vi7jea8j', getRoleEditedResources(securityLog))
      case LogEventEnum.UserSignedUp:
        return translate('text_1771937987062jy68yxfqjwx', {
          email: securityLog.userEmail,
        })
      case LogEventEnum.WebhookEndpointCreated:
        return translate('text_1771937987062g2z0d9cegyj', getWebhookResources(securityLog))
      case LogEventEnum.WebhookEndpointDeleted:
        return translate('text_177193798706284nfb2tmxkb', getWebhookResources(securityLog))
      case LogEventEnum.WebhookEndpointUpdated:
        return translate('text_1771937987062rw8agotc8gs', getWebhookResources(securityLog))
      default:
        return '-'
    }
  }

  const getSecurityLogDate = (securityLog: SecurityLogWithId) => {
    const formattedTime = intlFormatDateTimeOrgaTZ(securityLog.loggedAt, {
      formatTime: TimeFormat.TIME_24_WITH_SECONDS,
      formatDate: DateFormat.DATE_MED_SHORT,
    })

    return `${formattedTime.date}, ${formattedTime.time}`
  }

  return {
    getFormattedLogEvent,
    getSecurityLogDescription,
    getSecurityLogDate,
  }
}
