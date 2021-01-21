#!/usr/bin/env node

const { program } = require('commander');
const { version } = require('../package.json');
const upgradeDeps = require('../');

program
  .option('-b, --breaking', 'include breaking/major version upgrades')
  .version( version, '-v, --version', 'output the version')
  .description('CLI for automating upgrading package.json dependencies')
  .action( upgradeDeps );

program.parse( process.argv );
