/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

// TODO: sync babel config with gulpfile. There are differences (eg, we don't
// want to use the DEV plugin).

const assign = require('object-assign');
const babel = require('babel-core');
const babelDefaultOptions = require('fbjs-scripts/babel/default-options');
const createCacheKeyFunction = require('fbjs-scripts/jest/createCacheKeyFunction');
const fs = require('fs');
const getBabelRelayPlugin = require('../babel-relay-plugin');
const path = require('path');

const SCHEMA_PATH = path.resolve(__dirname, 'testschema.json');

const graphQLPlugin = getBabelRelayPlugin(
  JSON.parse(fs.readFileSync(SCHEMA_PATH, 'utf8')).data,
  {
    substituteVariables: true,
  }
);

// Fix the path to node_modules because jest is slooow with
// node_modules paths (facebook/jest#465)
function fixModules(list) {
  Object.keys(list).forEach(function(moduleName) {
    list[moduleName] = __dirname + '/../../node_modules/' + list[moduleName];
  });
  return list;
}

const babelOptions = assign(
  {},
  babelDefaultOptions,
  {
    plugins: babelDefaultOptions.plugins.concat([graphQLPlugin]),
    retainLines: true,
    blacklist: babelDefaultOptions.blacklist.concat('validation.react'),
    _moduleMap: fixModules(assign({}, babelDefaultOptions._moduleMap, require('fbjs/module-map'), {
      'React': 'react',
      'reactComponentExpect': 'react/lib/reactComponentExpect',
      'ReactDOM': 'react-dom',
      'ReactDOMServer': 'react-dom/server',
      'ReactUpdates': 'react/lib/ReactUpdates',
      'ReactTestUtils': 'react/lib/ReactTestUtils.js',
      'StaticContainer.react': 'react-static-container',
    })),
  }
);

module.exports = {
  process: function(src, path) {
    return babel.transform(src, assign({filename: path}, babelOptions)).code;
  },

  getCacheKey: createCacheKeyFunction([
    __filename,
    SCHEMA_PATH,
    path.join(__dirname, '..', 'babel-relay-plugin', 'package.json'),
  ]),
};
