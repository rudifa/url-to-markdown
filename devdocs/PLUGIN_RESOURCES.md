# Sources and destinations of plugin resources

This document outlines the sources and destinations of plugin resources used in the development of the plugin.

---

## Tables

### setup for github repo

| source of truth | process | destination  | description                        | referenced by |
| --------------- | ------- | ------------ | ---------------------------------- | ------------- |
| README.md       | -       | README.md    | Documentation file for the plugin. | github site   |
| img/type.gif    | -       | img/type.gif | GIF images used in the plugin.     | README.md     |

- Process
  - push changesto github repo and merge via PR

### setup for local install unpacked and for the release zip (for the install from marketplace)

| source of truth | process | destination      | description                                             | referenced by  |
| --------------- | ------- | ---------------- | ------------------------------------------------------- | -------------- |
| index.ts        | build   | dist/index.js    | Code entry point of the plugin, compiled from ts to js. | index.html     |
| index.html      | copy    | dist/index.html  | Main entry point of the plugin.                         | logseq app     |
| favicon.svg     | copy    | dist/favicon.svg | Favicon for the plugin, used in the browser tab.        | package.json   |
| README.md       | -       | README.md        | Documentation file for the plugin.                      | logseq Plugins |
| img/type.gif    | -       | img/type.gif     | GIF images used in the plugin.                          | README.md      |
| LICENSE         | -       | LICENSE          | License file for the plugin, detailing usage rights.    | -              |
| package.json    | -       | package.json     | Package file for the plugin, detailing dependencies.    | logseq Plugins |

- Process for the local build, install and run

  - Run the `npm run build` command to build the plugin.
  - Logseq - Plugins: Load unpacked plugin - navigate to the root folder of the plugin, click on the root folder.

- Process for the release zip creation, with github action Publish

  - Push the branch to github, create a pull request and merge it.
  - Create a new tagged release - this triggers the GitHub Action Publish.
    - Creates a zip file containing the contents of the `dist` folder and the copied files.
    - Creates a copy of the package.json file.
    - Note: the release process also creates a zip and a tar.gz of the complete repository.

- Process for the install unpacked from the release zip
  - Download the zip file from the release.
  - Unzip the file.
  - Logseq - Plugins: Load unpacked plugin - navigate to the root folder of the plugin, click on the root folder.

### marketplace entry

| source of truth | process | destination            | description                                       | referenced by  |
| --------------- | ------- | ---------------------- | ------------------------------------------------- | -------------- |
| manifest.json   | copy    | <plugin>/manifest.json | Manifest file for the plugin installation.        | logseq install |
| favicon.ico     | copy    | <plugin>/favicon.ico   | Favicon for the plugin, used in the Plugins view. | manifest.json  |

- Process for the marketplace entry creation

  - Create a fork of the marketplace repository.
  - Add a plugin folder.
  - Copy the `manifest.json` and `favicon.ico` files to the plugin root folder.
  - Create a Pull Request (PR) and wait for the approval.

- Process for installing from the marketplace
  - Logseq - Plugins: Install from marketplace - search for the plugin and install it.
