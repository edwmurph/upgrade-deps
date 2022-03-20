#!/usr/bin/env node

const { program } = require('commander');
const { version } = require('../package.json');
const upgradeDeps = require('../lib/upgrade-deps');
const reset = require('../lib/reset');

program
  .name('npx upgrade-deps')
  .version( version, '-v, --version', 'output the version' );

program
  .option( '-b, --breaking', 'include breaking/major version upgrades' )
  .option( '-d, --dry-run', 'just print which packages are out of date' )
  .description([
    'CLI for automating upgrading package.json dependencies.',
    'Semver prefixes will be stripped in favor of using exact versions.'
  ].join(' ') )
  .action( upgradeDeps );

program
  .command('reset')
  .description('does a fresh install of all dependencies')
  .addHelpText( 'after', `
reset command will to:
- switch to the node version specified in local .nvmrc
- remove your local node_modules directory (after prompting you to confirm)
- install dependencies from local package.json 
` )
  .action( reset );

program.parse( process.argv );
