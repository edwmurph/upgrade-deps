#!/usr/bin/env node

const { program } = require('commander');
const { version } = require('../package.json');
const upgradeDeps = require('../');

program
  .name('npx upgrade-deps')
  .option( '-b, --breaking', 'include breaking/major version upgrades' )
  .option( '-d, --dry-run', 'just print which packages are out of date' )
  .version( version, '-v, --version', 'output the version' )
  .description([
    'CLI for automating upgrading package.json dependencies.',
    'Semver prefixes will be stripped in favor of using exact versions.'
  ].join(' ') )
  .action( upgradeDeps );

program.parse( process.argv );
