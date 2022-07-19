import styled, { css } from 'styled-components'
import { useFormik } from 'formik'
import { generatePath } from 'react-router-dom'

import { Typography, ButtonLink, NavigationTab } from '~/components/designSystem'
import { theme, PageHeader } from '~/styles'
import { DatePickerField } from '~/components/form'
import { ONLY_DEV_DESIGN_SYSTEM_ROUTE, ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE } from '~/core/router'

const FORM_TAB_URL = generatePath(ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE, { tab: 'form' })
const LINK_TAB_URL = generatePath(ONLY_DEV_DESIGN_SYSTEM_TAB_ROUTE, { tab: 'links' })

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
      <NavigationTab
        name="design-system"
        tabs={[
          {
            title: 'Form',
            icon: 'switch',
            link: FORM_TAB_URL,
            match: [FORM_TAB_URL, ONLY_DEV_DESIGN_SYSTEM_ROUTE],
            component: (
              <Container>
                <Form onSubmit={(e) => e.preventDefault()}>
                  <GroupTitle variant="headline">Form</GroupTitle>
                  <Block $childMinWidth="325px">
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
            ),
          },
          {
            title: 'Links',
            icon: 'outside',
            link: LINK_TAB_URL,
            component: (
              <Container>
                <GroupTitle variant="headline">Links</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <ButtonLink title="Button Link" icon="rocket" to={ONLY_DEV_DESIGN_SYSTEM_ROUTE} />
                  <ButtonLink
                    active
                    icon="plug"
                    title="Button Link Active"
                    to={ONLY_DEV_DESIGN_SYSTEM_ROUTE}
                  />
                  <ButtonLink
                    disabled
                    title="Button Link Disabled"
                    to={ONLY_DEV_DESIGN_SYSTEM_ROUTE}
                  />
                </Block>
                <Block>
                  <a href="/"> Normal Link </a>
                </Block>
              </Container>
            ),
          },
        ]}
      ></NavigationTab>
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

const Block = styled.div<{ $childMinWidth?: string; $marginBottom?: string }>`
  display: flex;
  gap: ${theme.spacing(4)};
  flex-wrap: wrap;

  ${({ $childMinWidth }) =>
    !!$childMinWidth &&
    css`
      > * {
        min-width: ${$childMinWidth};
      }
    `}

  ${({ $marginBottom }) =>
    !!$marginBottom &&
    css`
      > * {
        margin-bottom: ${$marginBottom};
      }
    `}
`

const GroupTitle = styled(Typography)`
  margin-bottom: ${theme.spacing(4)};
`

export default DesignSystem
