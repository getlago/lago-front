import { FC } from 'react'

import { Typography } from '~/components/designSystem'
import { SettingsListItem, SettingsListItemHeader } from '~/components/layouts/Settings'
import { LanguageSettingsButton } from '~/components/settings/LanguageSettingsButton'
import { LocaleEnum } from '~/core/translations'
import { useInternationalization } from '~/hooks/core/useInternationalization'

interface LocaleBlockProps {
  className?: string
}

const LocaleBlock: FC<LocaleBlockProps> = ({ className }) => {
  const { translate, locale, updateLocale } = useInternationalization()

  return (
    <SettingsListItem className={className}>
      <SettingsListItemHeader
        label={translate('text_65c53053beb5f70cb8b7ca27')}
        sublabel={translate('text_65c53053beb5f70cb8b7ca28')}
        action={
          <LanguageSettingsButton
            language={locale as LocaleEnum}
            onChange={updateLocale}
            availableLocales={[LocaleEnum.en, LocaleEnum.pt_BR]}
          />
        }
      />

      <Typography color="grey700">
        {translate('text_65c53053beb5f70cb8b7ca29', {
          language: translate(mapLanguageKey(locale as LocaleEnum)),
        })}
      </Typography>
    </SettingsListItem>
  )
}

const mapLanguageKey = (language: LocaleEnum) => {
  switch (language) {
    case LocaleEnum.de:
      return 'text_6437d8583c62bc00c393d923'
    case LocaleEnum.es:
      return 'text_6526cbd3aedb8800aed06c3d'
    case LocaleEnum.fr:
      return 'text_640a0b75228ef90063296ea4'
    case LocaleEnum.it:
      return 'text_64e4ce3b2fa8940053c8a583'
    case LocaleEnum.nb:
      return 'text_640a0b75228ef90063296eb5'
    case LocaleEnum.pt_BR:
      return 'text_66b7d0d955677300665ac8d0'
    default:
      return 'text_6407684eaf41130074c4b2f7'
  }
}

export default LocaleBlock
