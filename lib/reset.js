const fs           = require('fs');
const { execSync } = require('child_process');

const cwd = process.cwd();

const packageJSON = require( `${ cwd }/package.json` );

function get_install_string( dep_type ) {
  const deps = packageJSON[dep_type] || {};

  const formatted = Object.keys( deps ).map( d => {
    const version = deps[ d ];
    return /^[0-9]+\.[0-9]+\.[0-9]+$/.test( version )
      ? d + '@' + version
      : version;
  });

  return formatted.join(' ');
}

function switch_node_version() {
  const nvmrc_path = `${ cwd }/.nvmrc`;

  if ( !fs.existsSync( nvmrc_path ) ) {
    return;
  }

  // only output logs if switching the node version worked
  const stdio = ['ignore', 'inherit', 'ignore'];

  try {
    execSync( `nvm use ${ nvmrc_path }`, { stdio } );
  } catch ( ex ) {
    // noop
  }

  try {
    execSync( `fnm use ${ nvmrc_path }`, { stdio } );
  } catch ( ex ) {
    // noop
  }
}

async function reset () {
  const node_modules_path = `${ cwd }/node_modules`;

  if ( fs.existsSync( node_modules_path ) ) {
    console.log( `Delete existing node modules at'${ node_modules_path }' to continue.` );
    return;
  }

  switch_node_version();

  const install_string = [
    'npm install --save false',
    get_install_string('dependencies'),
    get_install_string('devDependencies')
  ].join(' ');

  console.log('Installing all dependencies via:\n');

  console.log( install_string, '\n' );

  execSync( install_string, { cwd, stdio: 'inherit' } );

  console.log('\nSuccessfully reset node environment!');

  process.exit( 0 );
}

module.exports = reset;
