import { FC } from 'react'

import { Button, Popper } from '~/components/designSystem'
import { LocaleEnum } from '~/core/translations'
import { useInternationalization } from '~/hooks/core/useInternationalization'
import { MenuPopper } from '~/styles'

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
    case LocaleEnum['pt-BR']:
      return 'text_66b7d0d955677300665ac8d0'
    case LocaleEnum.sv:
      return 'text_6526cd088700e000714f0025'
    default:
      return 'text_6407684eaf41130074c4b2f7'
  }
}

interface LanguageSettingsButtonProps {
  language: LocaleEnum
  onChange: (language: LocaleEnum) => void
}

export const LanguageSettingsButton: FC<LanguageSettingsButtonProps> = ({ language, onChange }) => {
  const { translate } = useInternationalization()

  return (
    <Popper
      PopperProps={{ placement: 'bottom-end' }}
      opener={
        <Button variant="quaternary" endIcon="chevron-down">
          {translate(mapLanguageKey(language))}
        </Button>
      }
    >
      {({ closePopper }) => (
        <MenuPopper>
          <Button
            align="left"
            variant={language === LocaleEnum.de ? 'secondary' : 'quaternary'}
            onClick={() => {
              onChange(LocaleEnum.de)
              closePopper()
            }}
          >
            {translate(mapLanguageKey(LocaleEnum.de))}
          </Button>
          <Button
            align="left"
            variant={language === LocaleEnum.en ? 'secondary' : 'quaternary'}
            onClick={() => {
              onChange(LocaleEnum.en)
              closePopper()
            }}
          >
            {translate(mapLanguageKey(LocaleEnum.en))}
          </Button>
          <Button
            align="left"
            variant={language === LocaleEnum.es ? 'secondary' : 'quaternary'}
            onClick={() => {
              onChange(LocaleEnum.es)
              closePopper()
            }}
          >
            {translate(mapLanguageKey(LocaleEnum.es))}
          </Button>
          <Button
            align="left"
            variant={language === LocaleEnum.fr ? 'secondary' : 'quaternary'}
            onClick={() => {
              onChange(LocaleEnum.fr)
              closePopper()
            }}
          >
            {translate(mapLanguageKey(LocaleEnum.fr))}
          </Button>
          <Button
            align="left"
            variant={language === LocaleEnum.it ? 'secondary' : 'quaternary'}
            onClick={() => {
              onChange(LocaleEnum.it)
              closePopper()
            }}
          >
            {translate(mapLanguageKey(LocaleEnum.it))}
          </Button>
          <Button
            align="left"
            variant={language === LocaleEnum.nb ? 'secondary' : 'quaternary'}
            onClick={() => {
              onChange(LocaleEnum.nb)
              closePopper()
            }}
          >
            {translate(mapLanguageKey(LocaleEnum.nb))}
          </Button>
          <Button
            align="left"
            variant={language === LocaleEnum['pt-BR'] ? 'secondary' : 'quaternary'}
            onClick={() => {
              onChange(LocaleEnum['pt-BR'])
              closePopper()
            }}
          >
            {translate(mapLanguageKey(LocaleEnum['pt-BR']))}
          </Button>
          <Button
            align="left"
            variant={language === LocaleEnum.sv ? 'secondary' : 'quaternary'}
            onClick={() => {
              onChange(LocaleEnum.sv)
              closePopper()
            }}
          >
            {translate(mapLanguageKey(LocaleEnum.sv))}
          </Button>
        </MenuPopper>
      )}
    </Popper>
  )
}
