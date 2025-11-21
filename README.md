# Keelson Connector for Node-RED

A Docker Compose setup for integrating Node-RED with Keelson via Zenoh, using direct WebSocket connectivity.

## Overview

This project provides a ready-to-use environment that combines:

- **Zenoh Router** - Running with the Remote API plugin for WebSocket connectivity
- **Node-RED** - Visual flow programming with Zenoh nodes
- **[@freol35241/nodered-contrib-zenoh](https://www.npmjs.com/package/@freol35241/nodered-contrib-zenoh)** - Node-RED nodes for direct Zenoh pub/sub communication

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Zenoh         │◄───────►│  Zenoh Router    │◄───────►│  Node-RED       │
│   Network       │         │  + Remote API    │   WS    │  + Zenoh Nodes  │
│   (Peers)       │         │  (Port 10000)    │         │  (Port 1880)    │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

## Features

### Zenoh Connectivity
- Direct Zenoh pub/sub via WebSocket (no MQTT bridge required)
- Zenoh router with Remote API plugin
- WebSocket endpoint on port 10000
- Network mode: host (for easy local network Zenoh peer discovery)

### Node-RED Integration
- Pre-installed **[@freol35241/nodered-contrib-zenoh](https://www.npmjs.com/package/@freol35241/nodered-contrib-zenoh)** package
- Zenoh subscriber node for receiving messages
- Zenoh publisher node for sending messages
- Visual flow programming interface

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

### Stop the Environment

```bash
docker-compose down

# To also remove volumes
docker-compose down -v
```

## Using the Zenoh Nodes in Node-RED

### Zenoh Configuration Node

First, create a Zenoh configuration node:

1. Add a Zenoh subscriber or publisher node to your flow
2. Double-click to configure
3. Add a new Zenoh Config
4. Set the WebSocket URL to: `ws://localhost:10000`

### Zenoh Subscriber Node

Subscribes to a Zenoh key expression and outputs received messages.

**Configuration:**
- **Config**: Zenoh configuration (WebSocket URL)
- **Key Expression**: The Zenoh key to subscribe to (e.g., `keelson/v0/**`)

### Zenoh Publisher Node

Publishes messages to a Zenoh key expression.

**Configuration:**
- **Config**: Zenoh configuration (WebSocket URL)
- **Key Expression**: The Zenoh key to publish to

### Example Flow

Here's a simple example flow for subscribing to Keelson messages:

```
[zenoh-sub] → [function] → [debug]
```

The function node could process Keelson data:
```javascript
// Example: Parse incoming Keelson message
node.log(`Received on key: ${msg.key}`);
// msg.payload contains the raw payload
return msg;
```

## Keelson Key Space Convention

When working with Keelson, topics follow this hierarchy:

```
keelson/{major_version}/{realm}/{entity_id}/{category}/{subject}/{source_id}
```

**Example key expressions:**
- `keelson/v0/realm/my_boat/pub/rudder_angle_deg/rudder`
- `keelson/v0/realm/station_1/pub/raw_image/camera/rgb/0`
- `keelson/v0/**` (wildcard subscription for all Keelson messages)

## Docker Configuration

### Zenoh Router

The Zenoh router is configured with:
- **Image**: `eclipse/zenoh:1.6.2`
- **Mode**: `peer` - Allows direct Zenoh peer-to-peer connections
- **Remote API Plugin**: WebSocket on port 10000
- **Network Mode**: `host` - For easy peer discovery on local network

### Node-RED

The Node-RED container:
- Built from `nodered/node-red:latest`
- Pre-installs `@freol35241/nodered-contrib-zenoh`
- Runs with `--experimental-wasm-modules` for WebAssembly support
- **Network Mode**: `host` - Connects to Zenoh on localhost

## Development

### Modifying the Setup

Edit `docker-compose.yml` to customize:
- Zenoh configuration options
- Node-RED environment variables
- Network configuration

After changes:
```bash
docker-compose down
docker-compose up -d --build
```

### Persistent Data

Node-RED stores flows in the container's default location. To persist flows across rebuilds, consider adding a volume mount for `/data`.

## Future Work

- Integration with **keelson-js** SDK for envelope handling and protobuf support (currently commented out in Dockerfile)
- Custom Keelson-specific Node-RED nodes for envelope wrapping/unwrapping

## References

- [nodered-contrib-zenoh](https://www.npmjs.com/package/@freol35241/nodered-contrib-zenoh) - Zenoh nodes for Node-RED
- [Zenoh](https://zenoh.io/) - Zero Overhead Network Protocol
- [Zenoh Remote API Plugin](https://github.com/ZettaScaleLabs/zenoh-ts) - WebSocket/TypeScript interface for Zenoh
- [Keelson Protocol](https://github.com/RISE-Maritime/keelson) - Maritime data protocol
- [Node-RED Documentation](https://nodered.org/docs/)

## License

This project follows the same license as the Keelson project. See LICENSE file for details.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.
