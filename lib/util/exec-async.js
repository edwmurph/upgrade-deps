const { exec }      = require('child_process');
const { promisify } = require('util');

const exec_async = promisify( exec );

module.exports = exec_async;
