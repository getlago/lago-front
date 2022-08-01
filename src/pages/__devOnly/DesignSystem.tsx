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
                <GroupTitle variant="subhead">Link in navigation tabs</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <ButtonLink type="tab" icon="rocket" to={ONLY_DEV_DESIGN_SYSTEM_ROUTE}>
                    Non active Link
                  </ButtonLink>
                  <ButtonLink type="tab" active icon="plug" to={ONLY_DEV_DESIGN_SYSTEM_ROUTE}>
                    Active
                  </ButtonLink>
                  <ButtonLink
                    type="tab"
                    icon="plug"
                    external
                    to="https://www.youtube.com/watch?v=h6fcK_fRYaI&ab_channel=Kurzgesagt%E2%80%93InaNutshell"
                  >
                    External
                  </ButtonLink>
                  <ButtonLink type="tab" disabled to={ONLY_DEV_DESIGN_SYSTEM_ROUTE}>
                    Disabled
                  </ButtonLink>
                </Block>
                <GroupTitle variant="subhead">Button Links</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <ButtonLink type="button" to={ONLY_DEV_DESIGN_SYSTEM_ROUTE}>
                    Internal
                  </ButtonLink>
                  <ButtonLink
                    type="button"
                    external
                    to="https://www.youtube.com/watch?v=h6fcK_fRYaI&ab_channel=Kurzgesagt%E2%80%93InaNutshell"
                  >
                    External
                  </ButtonLink>

                  <ButtonLink
                    type="button"
                    buttonProps={{ variant: 'tertiary', startIcon: 'bell' }}
                    to={ONLY_DEV_DESIGN_SYSTEM_ROUTE}
                  >
                    With Button Props
                  </ButtonLink>
                </Block>
                <GroupTitle variant="subhead">Simple links</GroupTitle>
                <Block $marginBottom={theme.spacing(6)}>
                  <a href="https://main-app.staging.getlago.com/coupons"> Normal Link </a>
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
