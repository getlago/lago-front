import { useEffect, useState } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-ruby'
import 'prismjs/plugins/line-numbers/prism-line-numbers'
import 'prismjs/themes/prism-okaidia.css'
import styled from 'styled-components'

import { Typography, Button } from '~/components/designSystem'
import { theme } from '~/styles'
import { ComboBox } from '~/components/form'
import { useI18nContext } from '~/core/I18nContext'
import { addToast } from '~/core/apolloClient'

enum Language {
  node = 'node',
  ruby = 'ruby',
}

Prism.manual = true

interface CodeSnippetProps {
  className?: string
}

export const CodeSnippet = ({ className }: CodeSnippetProps) => {
  const { translate } = useI18nContext()
  const [language, setLanguage] = useState<string>(Language['node'])

  useEffect(() => {
    Prism.highlightAll()
  }, [language])

  const code = `[
  {
    "customerID": "{{customer_id}}",
    "meterApiName": "",
    "meterValue": 1,
    "meterTimeInMillis": 18593875774,
  }
]`
  const codeRuby = `if name == "John"
  puts "Hi There John!"
elsif name == "Bob"
  puts "Heyo Bob!"
else 
  puts "I don't know you! Stranger Danger!!"
end
`

  const html = Prism.highlight(code, Prism.languages.javascript, 'javascript')
  const htmlRuby = Prism.highlight(codeRuby, Prism.languages.ruby, 'ruby')

  return (
    <Content className={className}>
      <Title variant="bodyHl" color="textSecondary">
        {translate('text_623b42ff8ee4e000ba87d0b2')}
      </Title>
      <StyledComboBox
        value={language}
        onChange={(value) => setLanguage(value)}
        disableClearable
        data={[
          {
            value: Language['node'],
            label: translate('text_623b42ff8ee4e000ba87d0b6'),
          },
          {
            value: Language['ruby'],
            label: 'Ruby',
          },
        ]}
      />
      <Pre className="line-numbers language-javascript">
        <Code
          $hide={language !== Language['node']}
          component="code"
          variant="captionCode"
          html={html}
        />
        <Code
          $hide={language !== Language['ruby']}
          component="code"
          variant="captionCode"
          html={htmlRuby}
        />
        <span />
      </Pre>
      <Button
        variant="secondary"
        startIcon="duplicate"
        fullWidth
        onClick={() => {
          navigator.clipboard.writeText(language === Language['node'] ? code : codeRuby)
          addToast({
            severity: 'info',
            translateKey: 'text_6241ce41ae814301478358a2',
          })
        }}
      >
        {translate('text_623b42ff8ee4e000ba87d0c6')}
      </Button>
    </Content>
  )
}

const StyledComboBox = styled(ComboBox)`
  margin-bottom: ${theme.spacing(3)};
`

const Pre = styled.pre`
  background-color: ${theme.palette.grey[700]};
  padding: ${theme.spacing(4)};
  border-radius: 12px;
`

const Code = styled(Typography)<{ $hide: boolean }>`
  display: ${({ $hide }) => ($hide ? 'none' : 'block')};
`

const Title = styled(Typography)`
  margin-bottom: ${theme.spacing(6)};
`

const Content = styled.div`
  pre[class*='language-'] {
    margin: 0 0 ${theme.spacing(3)} 0;
    display: flex;
  }

  pre[class*='language-'].line-numbers {
    position: relative;
    padding-left: 42px;
    counter-reset: linenumber;
    border-radius: 12px;
  }

  pre[class*='language-'].line-numbers > code {
    position: relative;
    white-space: inherit;
  }

  .line-numbers .line-numbers-rows {
    position: absolute;
    pointer-events: none;
    top: 0;
    left: -42px;
    width: 30px;

    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  .line-numbers-rows > span {
    display: block;
    counter-increment: linenumber;
  }

  .line-numbers-rows > span:before {
    content: counter(linenumber);
    color: ${theme.palette.common.white};
    display: block;
    text-align: right;
  }

  > span {
    width: ${theme.spacing(3)};
  }
`
