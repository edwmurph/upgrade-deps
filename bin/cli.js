#!/usr/bin/env node

const { program } = require('commander');
const { version } = require('../package.json');
const upgrade_deps = require('../lib/upgrade-deps');

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
  .action( upgrade_deps );

program.parse( process.argv );
