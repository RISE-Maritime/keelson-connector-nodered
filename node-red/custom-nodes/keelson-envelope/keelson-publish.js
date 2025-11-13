const mqtt = require('mqtt');
const { enclose, construct_pubSub_key } = require('keelson-js');

module.exports = function(RED) {
    function KeelsonPublishNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

        // Connect to MQTT broker
        const brokerUrl = `mqtt://${config.broker}:${config.port}`;
        const client = mqtt.connect(brokerUrl);

        client.on('connect', () => {
            node.status({fill:"green", shape:"dot", text:"connected"});
        });

        client.on('error', (err) => {
            node.status({fill:"red", shape:"ring", text:"error"});
            node.error(`MQTT Error: ${err.message}`);
        });

        node.on('input', (msg) => {
            if (!client || !client.connected) {
                node.error('MQTT client not connected');
                return;
            }

            try {
                // Prepare the payload (ensure it's a Uint8Array)
                let payload;
                if (Buffer.isBuffer(msg.payload)) {
                    payload = new Uint8Array(msg.payload);
                } else if (msg.payload instanceof Uint8Array) {
                    payload = msg.payload;
                } else if (typeof msg.payload === 'string') {
                    payload = new Uint8Array(Buffer.from(msg.payload));
                } else if (typeof msg.payload === 'object') {
                    payload = new Uint8Array(Buffer.from(JSON.stringify(msg.payload)));
                } else {
                    node.error('Payload must be a Buffer, Uint8Array, string, or object');
                    return;
                }

                // Enclose the payload using Keelson SDK
                // Optional: Use msg.enclosedAt if provided, otherwise SDK uses current time
                const enclosedAt = msg.enclosedAt ? new Date(msg.enclosedAt) : undefined;
                const encodedEnvelope = enclose(payload, enclosedAt);

                // Publish to MQTT
                const topic = msg.topic || config.topic;
                const options = {
                    qos: parseInt(config.qos),
                    retain: config.retain
                };

                client.publish(topic, Buffer.from(encodedEnvelope), options, (err) => {
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
                node.error(`Failed to enclose payload: ${err.message}`);
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
