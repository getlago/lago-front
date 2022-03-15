# Lago - Front

## Local environment setup

To install the full app, you can refer to the [Lago README](https://github.com/getlago/lago#readme)

### Development usefull commands

```bash
# Code formating
yarn lint

# Tests
yarn test

# Codegen to generate types from the api schemas
# (make sure the api is running)
yarn codegen
yarn codegen:watch # will run anytime a new file is saved

# Translations
yarn ditto # Pull new translations
yarn ditto:addNew # Register new project from Ditto

# Bundle analyser
yarn build:analyseBundle
```

**_Note : linter and tests are run during the pull request pipelines_**
