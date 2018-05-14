'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var Promise = _interopDefault(require('bluebird'));
var _ = _interopDefault(require('lodash'));

function lift(done) {
  let self = this;
  let pins = [];

  _.each(self.config.routes, (action, key) => {
    let index = key.indexOf(' ');
    let keyParts = [key.slice(0, index), key.slice(index + 1)];
    let method = (keyParts[0] || '').toLowerCase();
    let pattern = keyParts[1];

    if (!_.includes(['add', 'wrap'], method)) {
      throw new Error(`invalid route method: ${method}`);
    }

    let actionParts = action.split('.');
    let controllerName = actionParts[0];
    let controller = self.controllers[controllerName];

    if (!controller) {
      throw new Error(`undefined controller: ${controllerName}`);
    }

    let actionMethodName = actionParts[1];
    let actionMethod = controller[actionMethodName];

    if (!actionMethod) {
      throw new Error(`undefined action method: ${action}`);
    }

    pins.push(`{${pattern}}`);
    self.seneca[method](pattern, actionMethod);
  });

  let senecaConnectionName = _.merge({}, self.config.seneca, (self.config.seneca || {}).route).connection;

  let senecaConnection = self.config.connections[senecaConnectionName];

  if (senecaConnectionName && !senecaConnection) {
    throw new Error(`unknown seneca connection:${senecaConnectionName}`);
  }

  if (!senecaConnection.options.pins && !senecaConnection.options.pin) {
    senecaConnection.options.pin = `[${pins.join(',')}]`;
  }

  if (senecaConnection.transport) {
    self.seneca.use(senecaConnection.transport);
  }

  self.seneca.listen(senecaConnection.options);
  process.nextTick(done);
}

var index = Promise.promisify(lift);

module.exports = index;
//# sourceMappingURL=bundle.cjs.js.map
