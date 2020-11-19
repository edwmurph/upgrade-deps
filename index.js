const fs            = require('fs');
const { exec }      = require('child_process');
const { promisify } = require('util');
const path          = require('path');
const packageJSON   = require(path.join(process.cwd(), 'package.json'));

const storage = '~/.upgrade-deps';

const execAsync = promisify( exec );
const writeFileAsync = promisify( fs.writeFile );
const semverRegexStr = '[0-9]+\\.[0-9]+\\.[0-9]+';
const semverRegex = new RegExp( `^${ semverRegexStr }$` );
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
    '&& git describe --tags `git rev-list --tags --max-count=1`',
  ].join(' '));

  return `${ repo }#${ latestTag.trim() }`;
};

const getLatest = async([ pkgName, version ]) => {
  let latest = version;

  if ( semverRegex.test( version ) ) {
    latest = await getLatestNpm( pkgName );
  } else if ( gitSemverRegex.test( version ) ) {
    latest = await getLatestGit( version );
  }

  return [ pkgName, latest ];
};

const upgradeDeps = async() => {
  try {
    await execAsync( `[ ! -d ${ storage } ]` ).catch( () => {
      console.error( `${ storage } must not exist` );
      process.exit( 1 );
    });

    await execAsync( `mkdir -p ${ storage }` );

    const depsPromise = Promise.all(
      Object.entries( packageJSON.dependencies || {} ).map( getLatest ),
    );

    const devDepsPromise = Promise.all(
      Object.entries( packageJSON.devDependencies || {} ).map( getLatest ),
    );

    const [ dependencies, devDependencies ] = await Promise.all([
      depsPromise,
      devDepsPromise,
    ]);


    const updated = Object.assign( {}, packageJSON, {
      dependencies: Object.fromEntries( dependencies ),
      devDependencies: Object.fromEntries( devDependencies ),
    });

    await writeFileAsync( 'package.json', JSON.stringify( updated, null, 2 ) );

    await execAsync( `rm -rf ${ storage }` );

    process.exit( 0 );
  } catch ( ex ) {
    console.error( 'Failure upgrading deps', ex );

    await execAsync( `rm -rf ${ storage }` );

    process.exit( 1 );
  }
};

module.exports = upgradeDeps;
