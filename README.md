# Module Federation Vite nested-template export reproduction

A small, framework-free pnpm workspace reproducing a production build failure with
`@module-federation/vite@1.23.5` and `vite@8.3.4`, installed from public npm.

Repository: [francesc79/mf-vite-shared-export-scanner-repro](https://github.com/francesc79/mf-vite-shared-export-scanner-repro).

## Run

Requirements: Node.js 24.15.0 and pnpm 11.1.1 were used for verification.

```sh
git clone https://github.com/francesc79/mf-vite-shared-export-scanner-repro.git
cd mf-vite-shared-export-scanner-repro
pnpm install --frozen-lockfile
pnpm repro
```

The verifier runs three builds and exits successfully **only if the bug is reproduced**:

| Scenario | Expected result |
| --- | --- |
| Same nested-template source, without Module Federation | Build passes |
| Module Federation with a plain shared ESM module | Build passes |
| Module Federation with the nested-template shared module | `MISSING_EXPORT` for `answer` in a virtual `loadShare` module |

To run the failing build directly (expected exit code 1):

```sh
pnpm build:template
```

To run the controls individually:

```sh
pnpm build:template:baseline
pnpm build:control
```

## Minimal trigger

[packages/shared-demo/template.js](packages/shared-demo/template.js):

```js
const text = `${`'`}`;
export const answer = text.length;
```

The consumer performs an ordinary named import:

```js
import { answer } from 'shared-demo/template';
console.log(answer);
```

The module is valid ESM and exports `answer = 1`. The single quote inside the inner
template is literal text. Module Federation generates a shared wrapper that does
not export `answer`, so Rolldown rejects the consumer's import.

[packages/shared-demo/control.js](packages/shared-demo/control.js) exports a plain
constant and succeeds with the same federation configuration. The baseline uses
exactly the failing scenario's source and disables only the federation plugin.

The configuration uses one container, empty `exposes` and `remotes`, one singleton
share, and a JavaScript entry. It needs no browser, server, React, second application,
local plugin checkout, custom registry, or private dependency.

See [ISSUE.md](ISSUE.md) for an English issue draft and
[VERIFICATION.txt](VERIFICATION.txt) for the recorded result.
