#!/usr/bin/env node

const { program } = require('commander');
const { version } = require('../package.json');
const upgradeDeps = require('../');

program
  .version( version )
  .description('CLI for automating upgrading package.json dependencies')
  .action( upgradeDeps );

program.parse( process.argv );
