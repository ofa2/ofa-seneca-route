var _ = require('lodash');

module.exports = function (done) {
  var self = this;
  var routes = self.config.routes;
  _.each(self.config.routes, function (action, key) {
    var index = key.indexOf(' ');
    var keyParts = [key.slice(0, index), key.slice(index + 1)];
    var method = (keyParts[0] || '').toLowerCase();
    var pattern = keyParts[1];

    if(!(_.includes(['add', 'wrap'], method))) {
      throw new Error('invalid route method: ' + method);
    }

    var actionParts = action.split('.');
    var controller = self.controllers[actionParts[0]];
    var actionMethodName = actionParts[1];
    var actionMethod = controller[actionMethodName];
    if(!actionMethod) {
      throw new Error('undefined action method:' + action);
    }
    self.seneca[method](pattern, actionMethod);
  });
  self.seneca
    .use('seneca-amqp-transport')
    .listen({
      name: 'create_act.queue', // This is optional
      type: 'amqp',
      pin: 'role:api'
    });
  process.nextTick(done);
};
