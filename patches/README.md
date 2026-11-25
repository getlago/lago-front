# Base UI patch maintenance

The @base-ui/react 1.9.0 patch resets the active filtered index after an item selection clears an outside query while a controlled multiple popup stays open. Without it, repeated Enter can select a different unfiltered item. Both CommonJS and ESM builds are patched.

No exact upstream issue for this reproduction has been verified. Related upstream discussion: https://github.com/mui/base-ui/issues/3977 (query clearing/cancellation); it is not evidence that our highlight regression is fixed.

On each Base UI upgrade, try the new version without the patch and run the pointer/keyboard filtered-selection and repeated-Enter tests in packages/ui/src/components/__tests__/combobox.test.tsx, plus controlled-query and IME tests. Remove patchedDependencies and the patch only when those tests and the browser reproduction pass unpatched. Otherwise regenerate both build patches for the new pinned version and verify a frozen-lockfile install and Docker patch copying. Never reuse the old version's patch without verification.
