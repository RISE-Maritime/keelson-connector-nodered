const mqtt = require('mqtt');
const { uncover, parse_pubsub_key } = require('keelson-js');

module.exports = function(RED) {
    function KeelsonSubscribeNode(config) {
        RED.nodes.createNode(this, config);
        const node = this;

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
                // Uncover the envelope using Keelson SDK
                const [enclosedAt, receivedAt, payload] = uncover(new Uint8Array(message));

                // Parse the key to extract metadata
                const keyParts = parse_pubsub_key(topic);

                // Send the unpacked message
                node.send({
                    topic: topic,
                    payload: Buffer.from(payload),
                    envelope: {
                        enclosedAt: enclosedAt,
                        receivedAt: receivedAt
                    },
                    keelson: {
                        basePath: keyParts?.basePath,
                        entityId: keyParts?.entityId,
                        subject: keyParts?.subject,
                        sourceId: keyParts?.sourceId
                    },
                    _msgid: RED.util.generateId()
                });
            } catch (err) {
                node.error(`Failed to uncover envelope: ${err.message}`, {topic: topic});
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

    RED.nodes.registerType("keelson-subscribe", KeelsonSubscribeNode);
}
