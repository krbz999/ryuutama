# Contributing to this package

## Developer Tooling

To start, clone this repository and either place it in or symlink it to your `data/systems/<package id>` user data directory.

To provide type and i18n support, this repository uses a postinstall script that symlinks your local Foundry installation. For this to work, copy `example-foundry-config.yaml` and rename it to `foundry-config.yaml`, then replace the value of the `installPath` field.

Once this is done you can run `npm install` to install all relevant dependencies.

For vscode, you will need to create a `.vscode/settings.json` file with the following:

```json
{
  "eslint.enable": true,
  "eslint.validate": ["javascript", "handlebars", "html"]
}
```

Also copy the following into your `.vscode/settings.json` to support i18n-ally:
```json
"i18n-ally.localesPaths": [
  "lang",
  "foundry/lang"
],
"i18n-ally.keystyle": "nested",
```

### VSCode support for i18n

If you are using VSCode, the i18n Ally (ID: `lokalise.i18n-ally`) extension will preview the content of i18n strings by pulling from both `lang/en.json` as well as the symlinked core translation files at `foundry/lang/en.json`.

## Compendiums

These commands can be used to pack (`npm run db:pack`) or unpack (`npm run db:unpack`) the compendiums.
