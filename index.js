const fs            = require('fs');
const { exec }      = require('child_process');
const { promisify } = require('util');
const path          = require('path');

const storage = '~/.upgrade-deps';

const execAsync = promisify( exec );
const writeFileAsync = promisify( fs.writeFile );
const semverRegexStr = '[0-9]+\\.[0-9]+\\.[0-9]+';
const semverRegex = new RegExp( semverRegexStr );
const gitSemverRegex = new RegExp( `^.+#${ semverRegexStr }$` );

const getLatestNpm = async( pkgName ) => {
  const { stdout, stderr } = await execAsync( `npm show ${ pkgName } version` );

  if ( stderr ) {
    throw new Error( stderr );
  }

  return stdout.trim();
};

const getLatestGit = async( version ) => {
  const [ repo ] = version.split('#');

  const destination = `${ storage }/${ repo }`;

  await execAsync( `git clone git@github.com:${ repo } ${ destination }` );

  const { stdout: latestTag } = await execAsync([
    `cd ${ destination }`,
    '&& git describe --tags `git rev-list --tags --max-count=1`'
  ].join(' ') );

  return `${ repo }#${ latestTag.trim() }`;
};

const getLatest = async([ pkgName, version ]) => {
  let latest = version;

  if ( gitSemverRegex.test( version ) ) {
    latest = await getLatestGit( version );
  } else if ( semverRegex.test( version ) ) {
    latest = await getLatestNpm( pkgName );
  }

  return [ pkgName, latest ];
};

const getPackageJSON = () => {
  const pkgJSONPath = path.join( process.cwd(), 'package.json' );

  try {
    return require( pkgJSONPath );
  } catch ( ex ) {
    if ( ex.code === 'MODULE_NOT_FOUND' ) {
      throw new Error( `couldnt find package.json in current directory: ${ pkgJSONPath }` );
    }
    throw ex;
  }
};

const upgradeDeps = async({ breaking }) => {
  try {
    const packageJSON = getPackageJSON();

    await execAsync( `[ ! -d ${ storage } ]` ).catch( () => {
      console.log( `State directory "${ storage }" must be deleted to continue` );
      process.exit( 1 );
    });

    await execAsync( `mkdir -p ${ storage }` );

    const depsPromise = Promise.all(
      Object.entries( packageJSON.dependencies || {} ).map( getLatest )
    );

    const devDepsPromise = Promise.all(
      Object.entries( packageJSON.devDependencies || {} ).map( getLatest )
    );


    const [ dependencies, devDependencies ] = await Promise.all([
      depsPromise,
      devDepsPromise
    ]);

    const updated = Object.assign( {}, packageJSON );

    if ( dependencies.length ) {
      updated.dependencies = Object.fromEntries(
        dependencies.map( ([name, version]) => {
          const prevVersion = packageJSON.dependencies[name];
          const majorBump = prevVersion.split('.')[0] !== version.split('.')[0];
          return [name, !majorBump || breaking ? version : prevVersion];
        })
      );
    }

    if ( devDependencies.length ) {
      updated.devDependencies = Object.fromEntries(
        devDependencies.map( ([name, version]) => {
          const prevVersion = packageJSON.devDependencies[name];
          const majorBump = prevVersion.split('.')[0] !== version.split('.')[0];
          return [name, !majorBump || breaking ? version : prevVersion];
        })
      );
    }

    await writeFileAsync( 'package.json', JSON.stringify( updated, null, 2 ).trim() );

    await execAsync( `rm -rf ${ storage }` );

    process.exit( 0 );
  } catch ( ex ) {
    console.error( 'Failure upgrading deps', ex );

    await execAsync( `rm -rf ${ storage }` );

    process.exit( 1 );
  }
};

module.exports = upgradeDeps;
