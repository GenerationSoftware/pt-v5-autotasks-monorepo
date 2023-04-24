# v5-autotasks

Monorepo grouping OpenZeppelin Defender autotasks for the PoolTogether hyperstructure (v5).

## Development

### Caveats

When supplying EVM addresses via env vars leave out the `0x` or else some build systems will interpret it as a number instead of a string.

### Add a package

To add a package, you need to run:

```
lerna create <package_name>
```

#### Setup TypeScript

This repository uses [TypeScript](https://www.typescriptlang.org/) and each packages reference the global [tsconfig.json](./tsconfig.json).

Add the following `tsconfig.json` file in your package:

```
{
 "extends": "../../tsconfig.json",
 "compilerOptions": {
   "outDir": "./lib"
 },
 "include": [
   "./src"
 ]
}
```

#### Setup Jest

Jest is being used to run tests.

Add the following `jest.config.js` file in your package:

```
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
};
```

#### Setup package.json scripts

Once TypeScript and Jest have been setup, you need to add the following scripts to your package `package.json`:

```
"scripts": {
  "format": "prettier --config ../../.prettierrc --ignore-path ../../.prettierignore --write \"**/*.{ts,js}\"",
  "tsc": "tsc",
  "test": "jest ./__tests__/index.ts"
},
```

### Compile a package

In the package directory, run the following command:

```
npm run tsc
```

If you wish to compile all packages, you can run the following command in the root directory of this project:

```
lerna run tsc
```

### Publish a package

In the root directory of this project, run the following command:

```
npm run publish
```

If it's the first time you publish this package, you will need to pass `--access public`:

```
npm run publish --access public
```

### Tests

To run unit tests across all packages, run:

```
lerna run test
```

### Code quality

[Prettier](https://prettier.io) is used to format TypeScript code. Use it by running:

```
lerna run format
```

### Todo:

- ArbLiquidator bot could likely benefit from multicall to speed it up
