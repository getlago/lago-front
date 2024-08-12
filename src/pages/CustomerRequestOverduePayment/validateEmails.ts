import { string } from 'yup'

// Matches a comma surrounded by optional whitespace
const SEPARATOR_REGEX = /\s*,\s*/

export const validateEmails = (emails: string): boolean => {
  const emailArray = emails
    .trim()
    .split(SEPARATOR_REGEX)
    .filter((email) => email.length > 0)

  for (let email of emailArray) {
    if (!string().email().isValidSync(email)) {
      return false
    }
  }
  return true
}

export const serializeEmails = (emails: string): string => {
  return emails.replace(' ', '')
}
