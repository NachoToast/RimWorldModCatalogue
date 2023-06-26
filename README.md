# RimWorld Mod Catalogue <!-- omit in toc -->

[![CI](https://github.com/NachoToast/RimWorldModCatalogue/actions/workflows/node.js.ci.yml/badge.svg)](https://github.com/NachoToast/RimWorldModCatalogue/actions/workflows/node.js.ci.yml)
[![Deploy](https://github.com/NachoToast/RimWorldModCatalogue/actions/workflows/deploy.yml/badge.svg)](https://github.com/NachoToast/RimWorldModCatalogue/actions/workflows/deploy.yml)
[![CodeQL](https://github.com/NachoToast/RimWorldModCatalogue/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/NachoToast/RimWorldModCatalogue/actions/workflows/codeql-analysis.yml)

## Table of Contents <!-- omit in toc -->

- [Why was this made?](#why-was-this-made)
- [Technologies](#technologies)
- [Limitations](#limitations)
- [Contributing](#contributing)
- [Installing](#installing)
- [Licensing](#licensing)


The RimWorld Mod Catalogue is a fullstack application aimed to provide a better mod browsing experience for RimWorld players.

You can find it at [https://rimworld.nachotoast.com](https://rimworld.nachotoast.com).

### Why was this made?

The Steam workshop tags for RimWorld mods are limited. Despite the large variety of mods out there they aren't categorized by their functionality at all.

![image](.github/images/BrowseTagsScreenshot.png)

The RimWorld Mod Catalogue aims to solve this problem by adding tags to mods based on keywords in their description, and then allowing users to search for mods using any combination of these tags.

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

  <a href="https://mozilla.github.io/nunjucks/">
  <img alt="Nunjucks" src="https://img.shields.io/badge/Nunjucks-1C4913?style=for-the-badge&logo=nunjucks&logoColor=white" />
  </a>

</div>

### Limitations

- The RimWorld Mod Catalogue is not a replacement for the Steam workshop. It does not allow users to download, comment, or otherwise interact with mods.
- Updates to mods on the Steam workshop are not reflected in the RimWorld Mod Catalogue until the server updates them. This is done on a schedule, so there may be a delay between when a mod is updated on the Steam workshop and when it is updated on the RimWorld Mod Catalogue.
  - Newly added mods and updates to the code of existing mods will be shown within **6 hours**.
  - Deleted mods and updates to other aspects of existing mods (description, thumbnail, etc.) will be shown within **1 week**.
- Tagging is done using the keywords in a mods description, so it will not be 100% perfect.
  - There are plans to use machine learning or AI to improve the tagging process in the future.
- Only mods that are publically available on the Steam workshop are included in the catalogue.
- Only **1.4** mods are included in the catalogue.

### Contributing

Contributions are always welcome, check out [CONTRIBUTING.md](./.github/CONTRIBUTING.md) to get started.


### Installing

If you want to run the RimWorld Mod Catalogue locally, check out the [installation guide](./.github/InstallationGuide.md).

### Licensing

The RimWorld Mod Catalogue is licensed under the [MIT License](./LICENSE).
