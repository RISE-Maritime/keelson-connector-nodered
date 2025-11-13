const mqtt = require('mqtt');
const protobuf = require('protobufjs');
const path = require('path');

module.exports = function(RED) {
    function KeelsonPublishNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Load the Envelope protobuf definition
        const protoPath = path.join(__dirname, '../../../protos/Envelope.proto');
        let Envelope;
        let client;

        protobuf.load(protoPath).then(root => {
            Envelope = root.lookupType('core.Envelope');

            // Connect to MQTT broker
            const brokerUrl = `mqtt://${config.broker}:${config.port}`;
            client = mqtt.connect(brokerUrl);

            client.on('connect', () => {
                node.status({fill:"green", shape:"dot", text:"connected"});
            });

            client.on('error', (err) => {
                node.status({fill:"red", shape:"ring", text:"error"});
                node.error(`MQTT Error: ${err.message}`);
            });

        }).catch(err => {
            node.error(`Failed to load proto file: ${err.message}`);
            node.status({fill:"red", shape:"ring", text:"proto error"});
        });

        node.on('input', (msg) => {
            if (!client || !client.connected) {
                node.error('MQTT client not connected');
                return;
            }

            try {
                // Prepare the payload (ensure it's a Buffer)
                let payload;
                if (Buffer.isBuffer(msg.payload)) {
                    payload = msg.payload;
                } else if (typeof msg.payload === 'string') {
                    payload = Buffer.from(msg.payload);
                } else if (typeof msg.payload === 'object') {
                    payload = Buffer.from(JSON.stringify(msg.payload));
                } else {
                    node.error('Payload must be a Buffer, string, or object');
                    return;
                }

                // Create the envelope
                const now = new Date();
                const envelope = {
                    enclosedAt: {
                        seconds: Math.floor(now.getTime() / 1000),
                        nanos: (now.getTime() % 1000) * 1000000
                    },
                    payload: payload
                };

                // Verify and encode the envelope
                const errMsg = Envelope.verify(envelope);
                if (errMsg) {
                    node.error(`Envelope verification failed: ${errMsg}`);
                    return;
                }

                const message = Envelope.create(envelope);
                const buffer = Envelope.encode(message).finish();

                // Publish to MQTT
                const topic = msg.topic || config.topic;
                const options = {
                    qos: parseInt(config.qos),
                    retain: config.retain
                };

                client.publish(topic, buffer, options, (err) => {
                    if (err) {
                        node.error(`Publish failed: ${err.message}`);
                        node.status({fill:"red", shape:"ring", text:"publish error"});
                    } else {
                        node.status({fill:"green", shape:"dot", text:"published"});
                        setTimeout(() => {
                            node.status({fill:"green", shape:"dot", text:"connected"});
                        }, 1000);
                    }
                });

            } catch (err) {
                node.error(`Failed to create envelope: ${err.message}`);
            }
        });

        node.on('close', (done) => {
            if (client) {
                client.end(true, done);
            } else {
                done();
            }
        });
    }

    RED.nodes.registerType("keelson-publish", KeelsonPublishNode);
}
