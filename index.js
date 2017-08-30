var Promise = require('bluebird');
var _ = require('lodash');

function lift (done) {
  var self = this;
  var routes = self.config.routes;
  var pins = [];

  _.each(self.config.routes, function (action, key) {
    var index = key.indexOf(' ');
    var keyParts = [key.slice(0, index), key.slice(index + 1)];
    var method = (keyParts[0] || '').toLowerCase();
    var pattern = keyParts[1];

    if(!(_.includes(['add', 'wrap'], method))) {
      throw new Error('invalid route method: ' + method);
    }

    var actionParts = action.split('.');
    var controllerName = actionParts[0];
    var controller = self.controllers[controllerName];
    if(!controller) {
      throw new Error('undefined controller: ' + controllerName);
    }

    var actionMethodName = actionParts[1];
    var actionMethod = controller[actionMethodName];
    if(!actionMethod) {
      throw new Error('undefined action method: ' + action);
    }
    pins.push('{' + pattern + '}');
    self.seneca[method](pattern, actionMethod);
  });

  var senecaConnectionName = _.merge({}, self.config.seneca, (self.config.seneca || {}).route).connection;
  var senecaConnection = self.config.connections[senecaConnectionName];
  if(senecaConnectionName && !senecaConnection) {
    throw new Error('unknown seneca connection:' + senecaConnectionName);
  }

  if(!senecaConnection.options.pins && !senecaConnection.options.pin) {
    senecaConnection.options.pin = '[' + pins.join(',') + ']';
  }
  if(senecaConnection.transport) {
    self.seneca.use(senecaConnection.transport);
  }
  self.seneca
    .listen(senecaConnection.options);
  process.nextTick(done);
};

module.exports = Promise.promisify(lift);

