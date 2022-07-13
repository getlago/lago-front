import styled from 'styled-components'
import { useFormik } from 'formik'

import { Typography } from '~/components/designSystem'
import { theme, PageHeader } from '~/styles'
import { DatePickerField } from '~/components/form'

const DesignSystem = () => {
  const formikProps = useFormik({
    initialValues: {
      date: undefined,
    },
    onSubmit: () => {},
  })

  return (
    <>
      <PageHeader $withSide>
        <Typography variant="bodyHl" color="textSecondary" noWrap>
          Design System components
        </Typography>
        <Typography variant="caption">Only visible in dev mode</Typography>
      </PageHeader>
      <Container>
        <Form onSubmit={(e) => e.preventDefault()}>
          <Typography variant="headline">Form</Typography>
          <Block>
            <DatePickerField name="date" label="Date Picker" formikProps={formikProps} />
            <DatePickerField
              name="date"
              label="Date Picker with helper"
              helperText="I'm here to help"
              formikProps={formikProps}
            />
            <DatePickerField
              name="date"
              label="Date Picker disabled"
              disabled
              formikProps={formikProps}
            />
          </Block>
        </Form>
      </Container>
    </>
  )
}

const Container = styled.div`
  padding: ${theme.spacing(8)} ${theme.spacing(12)} ${theme.spacing(20)};
`

const Form = styled.form`
  > *:first-child {
    margin-bottom: ${theme.spacing(4)};
  }
`

const Block = styled.div`
  display: flex;
  gap: ${theme.spacing(4)};
  flex-wrap: wrap;

  > * {
    min-width: 325px;
  }
`

export default DesignSystem
