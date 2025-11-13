# Keelson Connector for Node-RED

A complete Docker Compose setup for bi-directional integration of Keelson (Zenoh) via MQTT with Node-RED, including custom nodes for handling Keelson protocol envelopes.

## Overview

This project provides a ready-to-use environment that combines:

- **Zenoh MQTT Bridge** - Running in standalone mode to bridge Zenoh and MQTT protocols
- **Node-RED** - Visual flow programming with custom Keelson nodes
- **Keelson Proto Definitions** - Embedded protobuf schemas from the Keelson project
- **Custom Node-RED Nodes** - Pre-built nodes for packing/unpacking Keelson envelopes

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Zenoh/MQTT    │◄───────►│  Zenoh-MQTT      │◄───────►│  Node-RED   │
│   Publishers    │         │  Bridge          │         │  Flows      │
│   Subscribers   │         │  (Port 1883)     │         │  (Port 1880)│
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

### Node-RED Integration
- Custom **keelson-subscribe** node for receiving and unpacking envelopes
- Custom **keelson-publish** node for packing and publishing envelopes
- Full protobuf support with all Keelson message definitions
- Visual flow programming interface

### Keelson Protocol Support
- Envelope wrapping/unwrapping with timestamps
- Support for all Keelson payload types (Alarm, Audio, Primitives, etc.)
- Automatic key space convention handling
- Timestamp preservation (enclosed_at)

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

Subscribes to an MQTT topic and automatically unpacks Keelson envelopes.

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
    enclosedAt: {
      seconds: 1699876543,
      nanos: 123456000
    }
  }
}
```

### Keelson Publish Node

Wraps payload in a Keelson envelope and publishes to MQTT.

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
  topic: "vessel/@v1/entity_id/pubsub/subject/source"  // Optional override
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
msg.payload = msg.payload;
return msg;
```

## Keelson Key Space Convention

All topics follow the Keelson key space hierarchy:

```
{base_path}/@v{major_version}/{entity_id}/pubsub/{subject}/{source_id}
```

**Example topics:**
- `vessel/@v1/my_boat/pubsub/rudder_angle_deg/rudder`
- `shore/@v1/station_1/pubsub/raw_image/camera/rgb/0`
- `buoy/@v1/buoy_42/pubsub/wave_height_m/sensor`

## Proto Definitions

The following Keelson proto definitions are included:

### Core
- `Envelope.proto` - Message envelope wrapper

### Payloads
- `Primitives.proto` - Basic data types (floats, ints, strings)
- `Alarm.proto` - Alarm messages
- `Audio.proto` - Audio data
- `Decomposed3DVector.proto` - 3D vector data
- `FlagCode.proto` - Flag code enumerations
- `Geojson.proto` - Geographic data
- `LocationFixQuality.proto` - GPS fix quality
- `NetworkStatus.proto` - Network status
- `RadarReading.proto` - Radar data
- `ROCStatus.proto` - Rate of change status
- `SensorStatus.proto` - Sensor status
- `SimulationStatus.proto` - Simulation state
- `TargetType.proto` - Target classifications
- `VesselNavStatus.proto` - Vessel navigation
- `VesselType.proto` - Vessel classifications

All proto files are located in `/usr/src/node-red/protos/` inside the Node-RED container.

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

### Adding New Proto Definitions

1. Add proto files to `protos/` or `protos/payloads/`
2. Rebuild the container:
   ```bash
   docker-compose build node-red
   docker-compose up -d node-red
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

### Proto Loading Errors

Ensure proto files are correctly mounted:
```bash
docker-compose exec node-red ls -la /usr/src/node-red/protos/
```

## References

- [Keelson Protocol Specification](https://github.com/RISE-Maritime/keelson/blob/main/docs/protocol-specification.md)
- [Zenoh MQTT Bridge](https://github.com/eclipse-zenoh/zenoh-plugin-mqtt)
- [Node-RED Documentation](https://nodered.org/docs/)
- [Protocol Buffers](https://developers.google.com/protocol-buffers)

## License

This project follows the same license as the Keelson project. See LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
