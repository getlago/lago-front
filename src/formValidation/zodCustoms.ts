import { z } from 'zod'

import { allPermissions } from '~/pages/settings/roles/common/permissionsConst'
import { PermissionName } from '~/pages/settings/roles/common/permissionsTypes'

const EMAIL_REGEX: RegExp =
  // eslint-disable-next-line no-control-regex
  /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i

const DOMAIN_REGEX: RegExp =
  /^((?!-))(xn--)?[a-z0-9][a-z0-9-_]{0,61}[a-z0-9]{0,1}\.(xn--)?([a-z0-9-]{1,61}|[a-z0-9-]{1,30}\.[a-z]{2,})$/

export const zodMultipleEmails = z.string().refine((val) => {
  if (!val) return true
  if (typeof val !== 'string') return false
  const separatedEmails = val.split(',').map((mail) => mail.trim())

  try {
    z.array(z.string().regex(EMAIL_REGEX)).parse(separatedEmails)
  } catch {
    return false
  }

  return true
}, 'text_620bc4d4269a55014d493fc3')

export const zodDomain = z.string().refine((val) => {
  if (typeof val !== 'string') return false

  return DOMAIN_REGEX.test(val)
}, 'text_664c732c264d7eed1c74fe03')

export const zodOptionalUrl = z.string().refine((value) => {
  if (!value) return true

  try {
    z.url().parse(value)
  } catch {
    return false
  }

  return true
}, 'text_1764239804026ca61hwr3pp9')

export const zodOneOfPermissions = z.string().refine((value) => {
  if (typeof value !== 'string') return false

  return allPermissions.includes(value as PermissionName)
})
