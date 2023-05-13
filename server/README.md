# RimWorld Mod Catalogue / Server <!-- omit in toc -->

[![CI (Server)](https://github.com/NachoToast/RimWorldModCatalogue/actions/workflows/node.js.ci.server.yml/badge.svg)](https://github.com/NachoToast/RimWorldModCatalogue/actions/workflows/node.js.ci.server.yml)
[![CodeQL](https://github.com/NachoToast/RimWorldModCatalogue/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/NachoToast/RimWorldModCatalogue/actions/workflows/codeql-analysis.yml)
[![Deploy](https://github.com/NachoToast/RimWorldModCatalogue/actions/workflows/deploy.yml/badge.svg)](https://github.com/NachoToast/RimWorldModCatalogue/actions/workflows/deploy.yml)

The server for the RimWorld Mod Catalogue handles fetching and updating mod data from the Steam workshop, and provides an API for the client to use to query mod data.

## Table of Contents <!-- omit in toc -->

- [Technologies](#technologies)
- [Installation](#installation)
- [Documentation](#documentation)
  - [Script Reference](#script-reference)
  - [Dependency Reference](#dependency-reference)

### Technologies

<div style="display: flex">

  <a href="https://nodejs.org/">
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" />
  </a>

  <a href="https://www.typescriptlang.org/">
  <img alt="Typescript" src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
  </a>

  <a href="https://expressjs.com/">
  <img alt="Express.js" src="https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB" />
  </a>

  <a href="https://www.mongodb.com/">
  <img alt="MongoDB" src="https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white" />
  </a>

  <a href="https://jestjs.io/">
  <img alt="Jest" src="https://img.shields.io/badge/-jest-%23C21325?style=for-the-badge&logo=jest&logoColor=white" />
  </a>

</div>

### Installation

See the [installation guide](./docs/InstallationGuide.md).

### Documentation

#### Script Reference

-   `start` Starts the server with hot-reloading enabled.
-   `build` Compiles server source code into JavaScript.
-   `lint` Makes sure code follows style rules.
-   `typecheck` Makes sure there are no type errors in the code.
-   `test` Runs tests using Jest.
-   `check-all` Does linting, typechecking, and testing. Note that this requires pnpm.

#### Dependency Reference

- `axios` Makes HTTP requests to Steam web pages.
- `express` Provides a web server.
- `express-openapi-validator` Validates API requests and responses against an OpenAPI schema.
- `express-rate-limit` Limits the number of requests a client can make to the server.
- `mongodb` Stores mod data.
- `node-cron` Helps with sheduling (routinely updating mod data).
- `node-html-parser` Parses data from HTML responses.
- `swagger-ui-express` Provides a UI for viewing the OpenAPI schema (`/api-docs`).
