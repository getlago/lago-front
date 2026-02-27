import RichTextEditor from '~/components/designSystem/RichTextEditor/RichTextEditor'
import { Typography } from '~/components/designSystem/Typography'

import Block from '../common/Block'
import Container from '../common/Container'

const EditorTest = () => {
  return (
    <Container>
      <Typography className="mb-4" variant="headline">
        RichTextEditor
      </Typography>
      <Typography className="mb-4" variant="subhead1">
        Simple &#60;RichTextEditor/&#62;
      </Typography>
      <Block>
        <RichTextEditor />
      </Block>
    </Container>
  )
}

export default EditorTest
