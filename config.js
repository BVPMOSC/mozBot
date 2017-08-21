
var exports = module.exports = {};

// var packageConfig = require('./package.json').config;
var configJson = require('./config.json');

// var mergedConfig = Object.assign(packageConfig, configJson);

exports.github = {
  host: process.env.GHE_HOST || configJson.gheHost || 'github.com',
  apiHost: process.env.GHE_API_HOST || configJson.gheHost || 'api.github.com',
  protocol: process.env.GHE_PROTOCOL || configJson.gheProtocol || 'https',
  pathPrefix: process.env.GHE_PATH_PREFIX || configJson.ghePathPrefix,
  port: process.env.GHE_PORT || configJson.ghePort || 443
};