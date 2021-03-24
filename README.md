# ES6 Library Starter Kit
For when you want to write in ES6, linting, have static type checking, tests, examples, documentation generator and GH workflows to manage releases.

## Add GitHub Secrets
The project workflows require the following secrets:
- `NPM_TOKEN` for `npm-publish.yml` which will publish to NPM on each release in GitHub
- `DEPLOY_KEY` for `docs.yml` which will deploy documentation to GitHub pages

## Documentation
An example of generated documentation (using jsdoc) can be found here: https://docknetwork.github.io/es6-library-template/reference/
