# upgrade-deps

Minimal CLI for automating upgrading package.json dependencies

Features:
- updates package.json to use latest exact versions for dependencies + devDependencies
- parallelizes as much as possible so it's blazing fast
- code is minimal so it's easy to audit
- can upgrade npm dependencies
- can upgrade private dependencies in private git repos by cloning an ephemeral copy of the repo to `~/.upgrade-deps/` using your local git CLI

# Install

```
npm install --save-dev @edwmurph/upgrade-deps
```

# Usage

Simplest integration is to add a package.json script:

```
{
  "scripts": {
    "upgrade-deps": "upgrade-deps"
  }
}
```

And then

```
npm run upgrade-deps
```
