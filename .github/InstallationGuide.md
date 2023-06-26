# Installation Guide <!-- omit in toc -->

- [0. Install Main Dependencies](#0-install-main-dependencies)
- [1. Setup Repository \& Dependencies](#1-setup-repository--dependencies)
- [2. Add MongoDB Integration](#2-add-mongodb-integration)
- [3. Start the Server](#3-start-the-server)

## 0. Install Main Dependencies

You will need to manually install the following things on your system and add them to your path:

-   [Node JS](https://nodejs.org/) v16 or higher. Non-LTS and versions below 16 will probably work, but haven't been tested.
    - Test this by running `node -v` in a terminal.
-   [pnpm](https://pnpm.io/), recommended but npm and yarn should still work fine.
    -   If you've properly installed Node JS, you should be able to install pnpm by simply running `npm i -g pnpm` in a terminal.

## 1. Setup Repository & Dependencies

Now you can set up the repository from a terminal:

```sh
git clone https://github.com/NachoToast/RimWorldModCatalogue.git RimWorldModCatalogue
cd RimWorldCatalogue/server
pnpm install
cp config.example.json config.json
```

## 2. Add MongoDB Integration

Follow the instructions in the [MongoDB guide](./MongoDBGuide.md) to get a MongoDB cluster set up.

## 3. Start the Server

Now you can start the server (and other scripts) using `pnpm start` (or `npm start`).