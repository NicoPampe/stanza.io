'use strict';

module.exports = function (client, stanzas) {
  var NS = 'http://jitsi.org/protocol/colibri';
  if (client.config.useOldColibriNamespace) {
    NS =  'http://jitsi.org/protocol/focus';
  }

  client.disco.addFeature(NS);

  var types = stanzas.utils;

  var Conference = stanzas.define({
    name: 'conference',
    element: 'conference',
    namespace: NS,
    fields: {
      room: types.attribute('room'),
      machine: types.attribute('machine-uid')
    }
  });

  var Property = stanzas.define({
    name: 'property',
    element: 'property',
    fields: {
      name: types.attribute('name'),
      value: types.attribute('value')
    }
  });

  stanzas.extend(Conference, Property, 'properties');
  stanzas.withIQ(function (IQ) {
    stanzas.extend(IQ, Conference);
  });

  client.createConference = function(focus, room, machine, properties) {
    var propertiesArray = [];
    for (var prop in properties) {
      if (properties.hasOwnProperty(prop)) {
        propertiesArray.push({name: prop, value: properties[prop]});
      }
    }

    client.sendIq({
      to: focus,
      type: 'set',
      conference: {
        room: room,
        machine: machine,
        properties: propertiesArray
      }
    }, function iqCb(iq) {
      if (iq.err) {
        if (iq.err.code === '401') {
          client.emit('conference:not-authorized', iq.err);
        } else {
          client.emit('error', iq.err);
        }
      } else {
        client.emit('conference:created', iq.conference);
      }
    });
  };
};