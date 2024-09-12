import { string } from 'yup'

export const validateEmails = (emails: string): boolean => {
  const emailArray = emails.split(',').map((email) => email.trim())

  for (let email of emailArray) {
    if (!string().email().isValidSync(email)) {
      return false
    }
  }
  return true
}

export const serializeEmails = (emails: string): string => {
  return emails.replaceAll(' ', '')
}
