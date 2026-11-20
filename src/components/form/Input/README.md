# InputField for TanStack

`field.InputField` is the app adapter for the `lago-ui/input` and `lago-ui/field` primitives. It is registered alongside the legacy `field.TextInputField` in `useAppForm`; existing consumers are unchanged. AmountInput is not part of this integration.

```tsx
<form.AppField name="code">
  {(field) => (
    <field.InputField
      label={translate('name_translation_key')}
      beforeChangeFormatter={['code', 'lowercase']}
    />
  )}
</form.AppField>
```

Use `revalidateLogic()` and the form's `onDynamic` schema to preserve submit-first validation. The adapter calls `handleChange` and `handleBlur`; it does not add a touched-state gate or validators. Errors retain `silentError`, `displayErrorText`, `showOnlyErrors`, `errorOverride`, and `translateError` behavior. Overrides are already display text and are not translated again. `false` suppresses the error; `true` gives an invalid state without an error message. A helper remains visible when there is no error message, matching TextInputField.

Values are strings (or `undefined` for an absent optional field), including with the `int` formatter. Use `type="text"` and `inputMode="numeric"` or `"decimal"` for formatted numeric editing, so partial values such as `-` and `12.` remain representable. `formatValue` retains the legacy algorithm and order: `null` rejects an edit, while `''` clears the value. Formatting occurs on user edits, not on loading/resetting values. Composition text is held until composition ends. Legacy formatter imports remain supported.

Native input attributes are supported. Use `type="search"`, `type="password"`, or `variant="borderless"` for the package variants. Refs target the native input. IDs are generated unless supplied; labels, descriptions, helpers and errors are linked automatically, including any caller-provided `aria-describedby`. Pass `help={{ label, content }}` with translated content and a shared `TooltipProvider` above the form. MUI props, multiline, arbitrary adornments and clear buttons are not supported.

The standalone local-development review example is `/__dev/input-integration`; it is also available under the organization’s `/design-system/input-integration` tab. The standalone route is absent outside `APP_ENV=development`. It shows formatting, password reveal, submit-first validation, server errors, reset, and Addable behavior. An absent note is `undefined`; adding sets `''`. Deleting sets `undefined` explicitly, then resets field metadata, so re-adding never restores an old value. Its schema validates only present notes. The example makes no network requests and uses literal copy only for the dev preview.
