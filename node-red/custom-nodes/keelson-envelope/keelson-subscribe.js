const mqtt = require('mqtt');
const protobuf = require('protobufjs');
const path = require('path');

module.exports = function(RED) {
    function KeelsonSubscribeNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Load the Envelope protobuf definition
        const protoPath = path.join(__dirname, '../../../protos/Envelope.proto');
        let Envelope;

        protobuf.load(protoPath).then(root => {
            Envelope = root.lookupType('core.Envelope');

            // Connect to MQTT broker
            const brokerUrl = `mqtt://${config.broker}:${config.port}`;
            const client = mqtt.connect(brokerUrl);

            client.on('connect', () => {
                node.status({fill:"green", shape:"dot", text:"connected"});
                client.subscribe(config.topic, {qos: parseInt(config.qos)});
                node.log(`Subscribed to ${config.topic}`);
            });

            client.on('error', (err) => {
                node.status({fill:"red", shape:"ring", text:"error"});
                node.error(`MQTT Error: ${err.message}`);
            });

            client.on('message', (topic, message) => {
                try {
                    // Decode the envelope
                    const envelope = Envelope.decode(message);
                    const envelopeObj = Envelope.toObject(envelope, {
                        longs: String,
                        enums: String,
                        bytes: Buffer,
                        defaults: true
                    });

                    // Send the unpacked message
                    node.send({
                        topic: topic,
                        payload: envelopeObj.payload,
                        envelope: {
                            enclosedAt: envelopeObj.enclosedAt
                        },
                        _msgid: RED.util.generateId()
                    });
                } catch (err) {
                    node.error(`Failed to decode envelope: ${err.message}`, {topic: topic});
                }
            });

            node.on('close', (done) => {
                if (client) {
                    client.end(true, done);
                } else {
                    done();
                }
            });

        }).catch(err => {
            node.error(`Failed to load proto file: ${err.message}`);
            node.status({fill:"red", shape:"ring", text:"proto error"});
        });
    }

    RED.nodes.registerType("keelson-subscribe", KeelsonSubscribeNode);
}
