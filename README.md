# upgrade-deps

[![npm version](https://badge.fury.io/js/upgrade-deps.svg)](https://badge.fury.io/js/upgrade-deps)

Minimal CLI for automating upgrading package.json dependencies

Features:
- updates package.json to use latest exact versions within same major release for dependencies + devDependencies
- parallelizes as much as possible so it's blazing fast
- code is minimal so it's easy to audit
- can upgrade npm dependencies
- can upgrade private dependencies in private git repos by cloning an ephemeral copy of the repo to `~/.upgrade-deps/` using your local git CLI

# Usage

```
Usage: npx upgrade-deps [options]

CLI for automating upgrading package.json dependencies. Semver prefixes will be stripped in favor of using exact versions.

Options:
  -v, --version   output the version
  -b, --breaking  include breaking/major version upgrades
  -d, --dry-run   just print which packages are out of date
  -h, --help      display help for command
```

## npx

```
npx upgrade-deps
```
