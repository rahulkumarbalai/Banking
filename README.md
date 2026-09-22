# React + TypeScript + Vite

## English and Marathi

Use the **मराठी / English** button in the top navigation to switch languages on desktop or mobile. The app remembers the choice in `localStorage` under `banking-language`. On first use, a Marathi browser preference selects Marathi; other browser languages default to English.

Translations live in `src/i18n/messages.ts`. Use `useLanguage().tr()` for interface text and named placeholders for complete sentences. The language provider updates the HTML language, dates, and amount formatting without resetting page or form state. Amounts retain Latin digits and Indian grouping. Known system-generated ledger descriptions are translated for display; stored banking records, member names, and custom notes are preserved. CSV exports follow the selected language.

Run `npm test` for translation, interpolation, preference, and ledger-description checks, `npm run lint` for linting, and `npm run build` for the production build.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
