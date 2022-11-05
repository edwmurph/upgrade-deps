const fs            = require('fs');
const { promisify } = require('util');
const path          = require('path');
const exec_async     = require('./util/exec-async');

const storage = '~/.upgrade-deps';

const write_file_async = promisify( fs.writeFile );
const semver_regex_str = '[0-9]+\\.[0-9]+\\.[0-9]+';
const semver_regex = new RegExp( semver_regex_str );
const git_semver_regex = new RegExp( `^.+#${ semver_regex_str }$` );

async function get_latest_npm( pkg_name ) {
  const { stdout, stderr } = await exec_async( `npm show ${ pkg_name } version` );

  if ( stderr ) {
    throw new Error( stderr );
  }

  return stdout.trim();
}

async function get_latest_git( version ) {
  const [ repo ] = version.split('#');

  const destination = `${ storage }/${ repo }`;

  await exec_async( `git clone git@github.com:${ repo } ${ destination }` );

  const { stdout: latest_tag } = await exec_async([
    `cd ${ destination }`,
    '&& git describe --tags `git rev-list --tags --max-count=1`'
  ].join(' ') );

  return `${ repo }#${ latest_tag.trim() }`;
}

async function get_latest([ pkg_name, version ]) {
  let latest = version;

  if ( git_semver_regex.test( version ) ) {
    latest = await get_latest_git( version );
  } else if ( semver_regex.test( version ) ) {
    latest = await get_latest_npm( pkg_name );
  }

  return [ pkg_name, latest ];
}

function get_pkg_json() {
  const pkg_json_path = path.join( process.cwd(), 'package.json' );

  try {
    return require( pkg_json_path );
  } catch ( ex ) {
    if ( ex.code === 'MODULE_NOT_FOUND' ) {
      throw new Error( `couldnt find package.json in current directory: ${ pkg_json_path }` );
    }
    throw ex;
  }
}

async function upgrade_deps({ breaking, dryRun: dry_run }) {
  try {
    const pkg_json = get_pkg_json();

    await exec_async( `[ ! -d ${ storage } ]` ).catch( () => {
      console.log( `State directory "${ storage }" must be deleted to continue` );
      process.exit( 1 );
    });

    await exec_async( `mkdir -p ${ storage }` );

    const deps_promise = Promise.all(
      Object.entries( pkg_json.dependencies || {} ).map( get_latest )
    );

    const dev_deps_promise = Promise.all(
      Object.entries( pkg_json.devDependencies || {} ).map( get_latest )
    );

    const [ dependencies, dev_dependencies ] = await Promise.all([
      deps_promise,
      dev_deps_promise
    ]);

    const updated = Object.assign( {}, pkg_json );
    const dry_run_updates = { dependencies: {}, devDependencies: {} };

    if ( dependencies.length ) {
      updated.dependencies = Object.fromEntries(
        dependencies.map( ([name, version]) => {
          const prev_version = pkg_json.dependencies[name];
          const major_bump = prev_version.split('.')[0] !== version.split('.')[0];
          const new_version = !major_bump || breaking ? version : prev_version;

          if ( prev_version !== new_version ) {
            dry_run_updates.dependencies[ name ] = `${ prev_version } -> ${ new_version }`;
          }

          return [name, new_version];
        })
      );
    }

    if ( dev_dependencies.length ) {
      updated.devDependencies = Object.fromEntries(
        dev_dependencies.map( ([name, version]) => {
          const prev_version = pkg_json.devDependencies[name];
          const major_bump = prev_version.split('.')[0] !== version.split('.')[0];
          const new_version = !major_bump || breaking ? version : prev_version;

          if ( prev_version !== new_version ) {
            dry_run_updates.devDependencies[ name ] = `${ prev_version } -> ${ new_version }`;
          }

          return [name, new_version];
        })
      );
    }

    if ( dry_run ) {
      console.log('Dry run package updates:\n');
      console.log( JSON.stringify( dry_run_updates, null, 2 ) );
    } else {
      await write_file_async(
        'package.json',
        JSON.stringify( updated, null, 2 ).trim() + '\n'
      );
    }

    await exec_async( `rm -rf ${ storage }` );

    process.exit( 0 );
  } catch ( ex ) {
    console.error( 'Failure upgrading deps', ex );

    await exec_async( `rm -rf ${ storage }` );

    process.exit( 1 );
  }
}

module.exports = upgrade_deps;
