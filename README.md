# Keelson Connector for Node-RED

A complete Docker Compose setup for bi-directional integration of Keelson (Zenoh) via MQTT with Node-RED, powered by the official Keelson JavaScript SDK.

## Overview

This project provides a ready-to-use environment that combines:

- **Zenoh MQTT Bridge** - Running in standalone mode to bridge Zenoh and MQTT protocols
- **Node-RED** - Visual flow programming with custom Keelson nodes
- **Keelson JS SDK** - Official SDK for envelope handling, protobuf encoding/decoding, and key management
- **Custom Node-RED Nodes** - Pre-built nodes leveraging the SDK for seamless Keelson integration

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Zenoh/MQTT    │◄───────►│  Zenoh-MQTT      │◄───────►│  Node-RED   │
│   Publishers    │         │  Bridge          │         │  + Keelson  │
│   Subscribers   │         │  (Port 1883)     │         │  JS SDK     │
└─────────────────┘         └──────────────────┘         └─────────────┘
                                   ▲                            │
                                   │                            │
                                   └────────────────────────────┘
                                   Keelson Envelope Protocol
```

## Features

### Zenoh MQTT Bridge
- Standalone mode configuration
- MQTT broker on port 1883
- Zenoh peer connectivity on port 7447
- Optional REST API on port 8000 for monitoring

### Node-RED Integration with Keelson SDK
- Custom **keelson-subscribe** node for receiving and unpacking envelopes
- Custom **keelson-publish** node for packing and publishing envelopes
- Built on official **keelson-js** SDK (v0.4.4+)
- Automatic key parsing and validation
- Visual flow programming interface

### Keelson Protocol Support (via SDK)
- Envelope wrapping/unwrapping with timestamps
- Complete protobuf support (all message definitions included in SDK)
- Key space construction and parsing utilities
- Subject validation against well-known subjects
- Type-safe encoding/decoding

## Quick Start

### Prerequisites
- Docker
- Docker Compose

### Launch the Environment

```bash
# Clone the repository
git clone <repository-url>
cd keelson-connector-nodered

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Access the Services

- **Node-RED UI**: http://localhost:1880
- **Zenoh REST API**: http://localhost:8000 (optional monitoring)
- **MQTT Broker**: localhost:1883

### Stop the Environment

```bash
docker-compose down

# To also remove volumes
docker-compose down -v
```

## Using the Keelson Nodes in Node-RED

### Keelson Subscribe Node

Subscribes to an MQTT topic and automatically unpacks Keelson envelopes using the SDK.

**Configuration:**
- **Broker**: MQTT broker hostname (default: `zenoh-mqtt-bridge`)
- **Port**: MQTT port (default: `1883`)
- **Topic**: MQTT topic to subscribe to (e.g., `vessel/@v1/entity_id/pubsub/subject/source`)
- **QoS**: Quality of Service level (0, 1, or 2)

**Output Message:**
```javascript
{
  topic: "vessel/@v1/entity_id/pubsub/rudder_angle_deg/rudder",
  payload: <Buffer ...>,  // Unpacked protobuf payload
  envelope: {
    enclosedAt: Date,      // When the envelope was created
    receivedAt: Date       // When the envelope was received (optional)
  },
  keelson: {
    basePath: "vessel",
    entityId: "entity_id",
    subject: "rudder_angle_deg",
    sourceId: "rudder"
  }
}
```

### Keelson Publish Node

Wraps payload in a Keelson envelope and publishes to MQTT using the SDK.

**Configuration:**
- **Broker**: MQTT broker hostname (default: `zenoh-mqtt-bridge`)
- **Port**: MQTT port (default: `1883`)
- **Topic**: MQTT topic to publish to (e.g., `vessel/@v1/entity_id/pubsub/subject/source`)
- **QoS**: Quality of Service level (0, 1, or 2)
- **Retain**: Whether to retain the message

**Input Message:**
```javascript
{
  payload: <Buffer ...>,  // Serialized protobuf message or raw data
  topic: "vessel/@v1/entity_id/pubsub/subject/source",  // Optional override
  enclosedAt: Date        // Optional: specify envelope timestamp
}
```

### Example Flow

Here's a simple example flow that receives data, processes it, and republishes:

```
[keelson-subscribe] → [function] → [keelson-publish]
       ↓
    [debug]
```

The function node could transform the data:
```javascript
// Example: Pass through with logging
node.log(`Received from ${msg.keelson.subject} on ${msg.keelson.entityId}`);
msg.payload = msg.payload;
return msg;
```

## Keelson Key Space Convention

All topics follow the Keelson key space hierarchy:

```
{base_path}/@v{major_version}/{entity_id}/pubsub/{subject}/{source_id}
```

The SDK provides utilities for key construction and parsing:

```javascript
const { construct_pubSub_key, parse_pubsub_key } = require('keelson-js');

// Construct a key
const key = construct_pubSub_key({
  basePath: "vessel",
  majorVersion: 1,
  entityId: "my_boat",
  subject: "rudder_angle_deg",
  sourceId: "rudder"
});
// Returns: "vessel/@v1/my_boat/pubsub/rudder_angle_deg/rudder"

// Parse a key
const parts = parse_pubsub_key(key);
// Returns: { basePath, entityId, subject, sourceId }
```

**Example topics:**
- `vessel/@v1/my_boat/pubsub/rudder_angle_deg/rudder`
- `shore/@v1/station_1/pubsub/raw_image/camera/rgb/0`
- `buoy/@v1/buoy_42/pubsub/wave_height_m/sensor`

## Keelson JS SDK

This project uses the official [keelson-js](https://www.npmjs.com/package/keelson-js) SDK, which provides:

### Envelope Management
- `enclose(payload, enclosed_at?)` - Wraps payload in envelope
- `uncover(encodedEnvelope)` - Unwraps envelope, returns `[Date, Date|undefined, Uint8Array]`
- `encloseFromTypeName(typeName, payload)` - Encodes AND encloses in one step

### Payload Operations
- `encodePayloadFromTypeName(typeName, payload)` - Encodes typed objects
- `decodePayloadFromTypeName(typeName, encoded)` - Decodes payloads
- `getProtobufClassFromTypeName(typeName)` - Access protobuf classes

### Key Utilities
- `construct_pubSub_key()` - Build Keelson pub/sub keys
- `parse_pubsub_key()` - Parse keys into components
- `construct_rpc_key()` / `parse_rpc_key()` - RPC key management
- `get_subject_from_pubsub_key()` - Extract subject

### Subject Validation
- `isSubjectWellKnown(subject)` - Validate against registry
- `getSubjectSchema(subject)` - Get schema for known subjects

### Included Protobuf Definitions

The SDK includes all Keelson message definitions:

**Core:**
- Envelope - Message envelope wrapper

**Payloads:**
- Primitives - Basic data types
- Alarm, Audio, Geojson - Common data types
- RadarReading, VesselNavStatus, VesselType - Maritime-specific
- And more...

See the [Keelson repository](https://github.com/RISE-Maritime/keelson/tree/main/messages) for complete proto definitions.

## Development

### Modifying Custom Nodes

The custom nodes are located in:
```
node-red/custom-nodes/keelson-envelope/
├── package.json
├── keelson-subscribe.js
├── keelson-subscribe.html
├── keelson-publish.js
└── keelson-publish.html
```

After modifying the nodes:
```bash
# Rebuild the Node-RED container
docker-compose build node-red

# Restart the service
docker-compose up -d node-red
```

### Using SDK Functions in Function Nodes

You can access the Keelson SDK directly in Node-RED function nodes:

```javascript
const keelson = global.get('keelson') || require('keelson-js');

// Example: Encode a payload with a type
const encoded = keelson.encodePayloadFromTypeName('payloads.FloatValue', {
    value: 42.5
});

// Example: Validate a subject
if (keelson.isSubjectWellKnown('rudder_angle_deg')) {
    const schema = keelson.getSubjectSchema('rudder_angle_deg');
}

msg.payload = encoded;
return msg;
```

### Persistent Data

Node-RED flows and settings are stored in a Docker volume (`node-red-data`), so they persist across container restarts.

## Zenoh MQTT Bridge Configuration

The bridge is configured with the following parameters:

- **Mode**: `peer` - Allows direct Zenoh peer-to-peer connections
- **Listen**: `tcp/0.0.0.0:7447` - Accepts Zenoh connections
- **MQTT Port**: `1883` - Standard MQTT port
- **REST API**: `8000` - Optional monitoring endpoint

To customize the configuration, edit the `zenoh-mqtt-bridge` service command in `docker-compose.yml`.

### Monitoring the Bridge

Access the Zenoh REST API to query bridge status:

```bash
# Get bridge information
curl http://localhost:8000/@/service/*/mqtt

# Check Zenoh session info
curl http://localhost:8000/@/router/*
```

## Troubleshooting

### Node-RED Can't Connect to MQTT Broker

Ensure the services are on the same network:
```bash
docker-compose ps
docker network inspect keelson-connector-nodered_keelson-network
```

### Custom Nodes Not Appearing

Check the Node-RED logs:
```bash
docker-compose logs node-red
```

Verify nodes are installed:
```bash
docker-compose exec node-red npm list node-red-contrib-keelson-envelope
```

### SDK Loading Errors

Verify the SDK is installed:
```bash
docker-compose exec node-red npm list keelson-js
```

## References

- [Keelson Protocol Specification](https://github.com/RISE-Maritime/keelson/blob/main/docs/protocol-specification.md)
- [Keelson JS SDK](https://www.npmjs.com/package/keelson-js)
- [Keelson GitHub Repository](https://github.com/RISE-Maritime/keelson)
- [Zenoh MQTT Bridge](https://github.com/eclipse-zenoh/zenoh-plugin-mqtt)
- [Node-RED Documentation](https://nodered.org/docs/)

## License

This project follows the same license as the Keelson project. See LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
