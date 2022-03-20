const fs           = require('fs');
const prompt       = require('prompt');
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

  try {
    execSync( `nvm use ${ nvmrc_path }` );
  } catch ( ex ) {
    // noop
  }

  try {
    execSync( `fnm use ${ nvmrc_path }` );
  } catch ( ex ) {
    // noop
  }
}

async function reset () {
  switch_node_version();

  const node_modules_path = `${ cwd }/node_modules`;

  if ( fs.existsSync( node_modules_path ) ) {
    console.log( `Delete node modules in '${ node_modules_path }'?` );

    prompt.start();

    const { should_continue } = await prompt.get({
      properties: {
        should_continue: {
          description: '(y/n)',
          pattern: /^(y|n)$/,
          message: '(y/n)',
          required: true
        }
      }
    });

    if ( should_continue === 'y' ) {
      await fs.rmdirSync( node_modules_path, { recursive: true, force: true } );
      console.log('Deleted node modules.');
    } else {
      console.log('Skipping deleting node modules.');
    }
  }

  const install_string = [
    'npm install --save false',
    get_install_string('dependencies'),
    get_install_string('devDependencies')
  ].join(' ');

  console.log('Installing all dependencies...\n');

  execSync( install_string, { cwd, stdio: 'inherit' } );

  console.log('\nSuccessfully reset node environment!');

  process.exit( 0 );
}

module.exports = reset;
