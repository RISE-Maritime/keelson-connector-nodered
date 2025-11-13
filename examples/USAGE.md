# Usage Examples

This directory contains example Node-RED flows demonstrating how to use the Keelson nodes.

## Importing the Example Flow

1. Start the Docker Compose environment:
   ```bash
   docker-compose up -d
   ```

2. Open Node-RED in your browser: http://localhost:1880

3. Import the example flow:
   - Click the menu (three horizontal lines) in the top right
   - Select **Import**
   - Click **select a file to import**
   - Choose `examples/example-flow.json`
   - Click **Import**

4. Deploy the flow:
   - Click the **Deploy** button in the top right

## Example Flow Description

The example flow includes two demonstrations:

### Example 1: Subscribe and Republish

This flow demonstrates the complete cycle of receiving and sending Keelson messages:

1. **Keelson Subscribe** - Subscribes to `vessel/@v1/my_boat/pubsub/rudder_angle_deg/rudder`
2. **Debug** - Displays received messages in the debug panel
3. **Function** - Processes the data (you can add your own logic here)
4. **Keelson Publish** - Republishes to `vessel/@v1/my_boat/pubsub/processed_data/processor`

### Example 2: Manual Publish

This flow allows you to manually test publishing:

1. **Inject** - Click to manually trigger a test message
2. **Convert to Buffer** - Prepares the data for the envelope
3. **Keelson Publish** - Publishes the test message

## Testing with MQTT Tools

You can test the setup using standard MQTT tools:

### Using mosquitto_pub and mosquitto_sub

```bash
# Subscribe to all Keelson topics
mosquitto_sub -h localhost -t 'vessel/+/+/pubsub/#' -v

# Publish a raw test message (this won't be a proper Keelson envelope)
mosquitto_pub -h localhost -t 'vessel/@v1/test/pubsub/test/manual' -m 'test'
```

### Using MQTT Explorer

1. Download MQTT Explorer: https://mqtt-explorer.com/
2. Connect to `localhost:1883`
3. Browse topics and subscribe to `vessel/#`
4. Publish test messages

## Working with Protobuf Payloads

To send properly formatted protobuf messages, you'll need to:

1. Define your message using one of the Keelson proto files
2. Serialize it to a Buffer
3. Pass it to the Keelson Publish node

### Example: Publishing a Primitive Float Value

```javascript
// In a function node
const protobuf = require('protobufjs');

// Load the Primitives proto
const root = await protobuf.load('/usr/src/node-red/protos/payloads/Primitives.proto');
const FloatValue = root.lookupType('payloads.FloatValue');

// Create the message
const message = FloatValue.create({
    value: 42.5
});

// Encode to Buffer
const buffer = FloatValue.encode(message).finish();

// Set as payload
msg.payload = buffer;
msg.topic = 'vessel/@v1/my_boat/pubsub/rudder_angle_deg/rudder';

return msg;
```

## Key Space Conventions

Remember to follow Keelson key space conventions:

```
{base_path}/@v{major_version}/{entity_id}/pubsub/{subject}/{source_id}
```

### Components:

- **base_path**: Entity type (e.g., `vessel`, `shore`, `buoy`)
- **major_version**: Protocol version (e.g., `@v1`)
- **entity_id**: Unique identifier for your entity (e.g., `my_boat`, `station_1`)
- **subject**: Message type following naming conventions:
  - Raw: `raw` (with TimestampedBytes)
  - Primitive: `<entity>_<property>_<unit>` (e.g., `rudder_angle_deg`)
  - Complex: snake_case proto message name (e.g., `raw_image`)
- **source_id**: Source identifier, can be hierarchical (e.g., `rudder`, `camera/rgb/0`)

### Example Topics:

- `vessel/@v1/atlantic_explorer/pubsub/rudder_angle_deg/main_rudder`
- `vessel/@v1/atlantic_explorer/pubsub/raw_image/camera/bow/0`
- `shore/@v1/control_station/pubsub/command/operator_1`
- `buoy/@v1/weather_buoy_42/pubsub/wave_height_m/sensor`

## Debugging Tips

### Enable Debug Messages

Add debug nodes to view:
- Incoming envelope metadata
- Unpacked payloads
- Publish confirmations

### Check MQTT Connection

Verify the Zenoh-MQTT bridge is running:
```bash
docker-compose logs zenoh-mqtt-bridge
```

### Monitor Zenoh Activity

Use the REST API:
```bash
# Check MQTT bridge status
curl http://localhost:8000/@/service/*/mqtt

# List all Zenoh routes
curl http://localhost:8000/@/router/*/linkstate/routers
```

### Inspect Node-RED Logs

```bash
docker-compose logs -f node-red
```

## Advanced: Custom Proto Messages

If you want to create custom protobuf messages:

1. Add your `.proto` file to `protos/payloads/`
2. Rebuild the Node-RED container:
   ```bash
   docker-compose build node-red
   docker-compose up -d node-red
   ```
3. Use protobufjs in function nodes to encode/decode your messages

### Example Custom Proto

Create `protos/payloads/MyCustom.proto`:
```protobuf
syntax = "proto3";

package payloads;

message VesselPosition {
    double latitude = 1;
    double longitude = 2;
    float heading = 3;
    float speed = 4;
}
```

Then in a function node:
```javascript
const protobuf = require('protobufjs');
const root = await protobuf.load('/usr/src/node-red/protos/payloads/MyCustom.proto');
const VesselPosition = root.lookupType('payloads.VesselPosition');

const position = VesselPosition.create({
    latitude: 57.7089,
    longitude: 11.9746,
    heading: 180.0,
    speed: 12.5
});

msg.payload = VesselPosition.encode(position).finish();
msg.topic = 'vessel/@v1/my_boat/pubsub/vessel_position/gps';

return msg;
```

## Next Steps

- Explore the Keelson proto definitions in `protos/`
- Read the [Keelson Protocol Specification](https://github.com/RISE-Maritime/keelson/blob/main/docs/protocol-specification.md)
- Check out `protos/subjects.yaml` for standard subject naming conventions
- Build your own flows integrating with sensors, databases, or APIs
