# RimWorld Mod Catalogue / Client <!-- omit in toc -->

The client for the RimWorld Mod Catalogue handles displaying mod data to the user, and provides a UI for the user to search and filter mod data.

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
  <a href="https://vitejs.dev/">
  <img alt="Vite" src="https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=fff&style=for-the-badge" />
  </a>

</div>

### Installation

See the [installation guide](./docs/InstallationGuide.md).

### Documentation

#### Script Reference

- `start` Starts the client with hot-reloading enabled.
- `build` Compiles and bundles client source code into JavaScript, minifies CSS, and does other optimizations.
- `preview` Builds and serves a production build of the client.
- `lint` Makes sure code follows style rules.
- `typecheck` Makes sure there are no type errors in the code.
- `check-all` Does linting and typechecking. Note that this requires pnpm.

#### Dependency Reference

Unlike the server, there are only development dependencies for the client, as no dependencies are required to actually run it (it's just a website after all).

For the sake of documentation, the notable development dependencies are:

- `axios` Makes HTTP requests to the server.
- `vite` Does bundling and other build-process-related tasks.


