# [Bug]: Nested template literals can hide named exports and cause MISSING_EXPORT with Vite 8

## Describe the bug

A valid shared ESM module containing a nested template literal can lose its named
exports in the generated Module Federation `loadShare` wrapper. A production build
then fails with Rolldown's `MISSING_EXPORT` error.

The minimal shared module is:

```js
const text = `${`'`}`;
export const answer = text.length;
```

The single quote is ordinary text inside the inner template. The module exports
`answer = 1`, but the generated wrapper does not export `answer`.

## Reproduction

Attach or link this complete reproduction directory, including `pnpm-lock.yaml`.

```sh
pnpm install --frozen-lockfile
pnpm build:template
```

The build exits with code 1 and reports:

```text
[MISSING_EXPORT] "answer" is not exported by "\0virtual:mf:...__loadShare__shared_mf_2_demo_mf_1_template__loadShare__.js".
```

Alternatively, `pnpm repro` verifies the failure and two controls. It returns code
0 only when the two controls compile and the reported `MISSING_EXPORT` occurs:

```text
baseline-template: build passed
control: build passed
template: reproduced MISSING_EXPORT for answer
```

## Configuration

```js
federation({
  name: 'reproApp',
  filename: 'remoteEntry.js',
  manifest: false,
  dts: false,
  exposes: {},
  remotes: {},
  shared: { 'shared-demo/template': { singleton: true } },
})
```

The consumer imports `answer` from `shared-demo/template`. There is one local
workspace package and one container; no application framework or runtime host is
required to reproduce this build failure.

## Expected behavior

The build succeeds and the shared wrapper preserves the `answer` export.

## Actual behavior

The build fails with `MISSING_EXPORT` in the generated virtual shared module.
The exact same source compiles when the federation plugin is disabled. A plain
shared module also compiles with federation enabled.

## Environment

- `@module-federation/vite`: 1.23.5 (public npm package)
- Vite: 8.3.4
- Node.js: 24.15.0
- pnpm: 11.1.1
- OS: Linux x64
- All JavaScript files are ESM; the project uses no React or TypeScript source.

## Investigation

The lexical export scanner appears to treat a nested backtick as the end of the
outer template. It then treats the single quote as the start of a string, masking
the following real export. This matches inspection of `createCodePositionMap` and
`getNamedExportsViaRegex`, but the reproduction itself uses only public APIs and
unmodified npm packages.

Relevant source: [codePositionMap.ts](https://github.com/module-federation/vite/blob/main/src/utils/codePositionMap.ts)
and [virtualShared_preBuild.ts](https://github.com/module-federation/vite/blob/main/src/virtualModules/virtualShared_preBuild.ts).
