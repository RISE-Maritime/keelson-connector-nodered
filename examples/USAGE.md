# Usage Examples

This directory contains example Node-RED flows demonstrating how to use the Keelson nodes powered by the official Keelson JS SDK.

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
   - Automatically unpacks envelopes using the SDK
   - Provides parsed key components in `msg.keelson`
2. **Debug** - Displays received messages in the debug panel
3. **Function** - Processes the data (you can add your own logic here)
4. **Keelson Publish** - Republishes to `vessel/@v1/my_boat/pubsub/processed_data/processor`
   - Automatically wraps in envelope using the SDK

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

# Publish a raw test message (note: this won't be a proper Keelson envelope)
mosquitto_pub -h localhost -t 'vessel/@v1/test/pubsub/test/manual' -m 'test'
```

### Using MQTT Explorer

1. Download MQTT Explorer: https://mqtt-explorer.com/
2. Connect to `localhost:1883`
3. Browse topics and subscribe to `vessel/#`
4. Publish test messages

## Working with Keelson SDK in Function Nodes

The Keelson JS SDK is available in all Node-RED function nodes. Here are practical examples:

### Example 1: Encoding and Publishing a Typed Payload

```javascript
const keelson = global.get('keelson') || require('keelson-js');

// Create a FloatValue payload
const payload = {
    value: 42.5
};

// Encode it using the SDK
const encoded = keelson.encodePayloadFromTypeName('payloads.FloatValue', payload);

// The keelson-publish node will automatically wrap this in an envelope
msg.payload = Buffer.from(encoded);
msg.topic = 'vessel/@v1/my_boat/pubsub/rudder_angle_deg/rudder';

return msg;
```

### Example 2: Decoding a Received Payload

```javascript
const keelson = global.get('keelson') || require('keelson-js');

// msg.payload contains the unpacked payload from keelson-subscribe
// Decode it based on the subject
try {
    const decoded = keelson.decodePayloadFromTypeName(
        'payloads.FloatValue',
        new Uint8Array(msg.payload)
    );

    node.log(`Received value: ${decoded.value}`);
    msg.decodedPayload = decoded;
} catch (err) {
    node.error(`Failed to decode: ${err.message}`);
}

return msg;
```

### Example 3: Validating and Constructing Keys

```javascript
const keelson = global.get('keelson') || require('keelson-js');

// Construct a proper Keelson key
const key = keelson.construct_pubSub_key({
    basePath: "vessel",
    majorVersion: 1,
    entityId: "atlantic_explorer",
    subject: "vessel_position",
    sourceId: "gps/main"
});

node.log(`Generated key: ${key}`);
// Output: vessel/@v1/atlantic_explorer/pubsub/vessel_position/gps/main

// Validate the subject
if (keelson.isSubjectWellKnown('vessel_position')) {
    const schema = keelson.getSubjectSchema('vessel_position');
    node.log(`Schema: ${JSON.stringify(schema)}`);
}

msg.topic = key;
return msg;
```

### Example 4: Using encloseFromTypeName (All-in-One)

```javascript
const keelson = global.get('keelson') || require('keelson-js');

// Create your payload
const payload = {
    value: 15.7
};

// Encode AND enclose in one step
const envelope = keelson.encloseFromTypeName('payloads.FloatValue', payload);

// This is ready to publish directly to MQTT (bypassing keelson-publish node)
msg.payload = Buffer.from(envelope);
msg.topic = 'vessel/@v1/my_boat/pubsub/rudder_angle_deg/rudder';

return msg;
```

### Example 5: Parsing Received Keys

```javascript
const keelson = global.get('keelson') || require('keelson-js');

// The keelson-subscribe node already provides this in msg.keelson,
// but you can also parse manually
const parts = keelson.parse_pubsub_key(msg.topic);

if (parts) {
    node.log(`Base Path: ${parts.basePath}`);
    node.log(`Entity ID: ${parts.entityId}`);
    node.log(`Subject: ${parts.subject}`);
    node.log(`Source ID: ${parts.sourceId}`);

    // Use the parsed information
    if (parts.subject === 'rudder_angle_deg') {
        // Handle rudder angle data
    }
}

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

## Complete Example: Temperature Sensor Flow

Here's a complete example that demonstrates encoding, publishing, subscribing, and decoding:

### Function Node: "Generate Temperature Data"
```javascript
const keelson = global.get('keelson') || require('keelson-js');

// Generate random temperature reading
const temperature = 20 + Math.random() * 10; // 20-30°C

// Create FloatValue payload
const payload = { value: temperature };

// Encode using SDK
const encoded = keelson.encodePayloadFromTypeName('payloads.FloatValue', payload);

// Construct proper key
const topic = keelson.construct_pubSub_key({
    basePath: "vessel",
    majorVersion: 1,
    entityId: "my_boat",
    subject: "temperature_c",
    sourceId: "engine_room/sensor_1"
});

msg.payload = Buffer.from(encoded);
msg.topic = topic;

return msg;
```

### Function Node: "Process Temperature"
```javascript
const keelson = global.get('keelson') || require('keelson-js');

// Decode the payload from keelson-subscribe
try {
    const decoded = keelson.decodePayloadFromTypeName(
        'payloads.FloatValue',
        new Uint8Array(msg.payload)
    );

    const temp = decoded.value;
    node.log(`Temperature: ${temp.toFixed(1)}°C`);

    // Check for high temperature
    if (temp > 28) {
        node.warn(`High temperature alert: ${temp.toFixed(1)}°C`);
        msg.alert = true;
    }

    msg.temperature = temp;
    msg.decodedPayload = decoded;

} catch (err) {
    node.error(`Failed to decode temperature: ${err.message}`);
    return null;
}

return msg;
```

## Debugging Tips

### Enable Debug Messages

Add debug nodes to view:
- Incoming envelope metadata (`msg.envelope`)
- Parsed key components (`msg.keelson`)
- Unpacked payloads (`msg.payload`)
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

### Test SDK Functions in Function Node

Add a function node with this code to test SDK availability:
```javascript
const keelson = global.get('keelson') || require('keelson-js');

node.log('SDK Functions Available:');
node.log('- enclose');
node.log('- uncover');
node.log('- encodePayloadFromTypeName');
node.log('- decodePayloadFromTypeName');
node.log('- construct_pubSub_key');
node.log('- parse_pubsub_key');
node.log('- isSubjectWellKnown');

// Test key construction
const testKey = keelson.construct_pubSub_key({
    basePath: "test",
    majorVersion: 1,
    entityId: "test_entity",
    subject: "test_subject",
    sourceId: "test_source"
});

node.log(`Test key: ${testKey}`);

return msg;
```

## Available Protobuf Message Types

The SDK includes all Keelson protobuf definitions. Common types you can use:

### Primitives (payloads.*)
- `FloatValue` - Single float value
- `IntValue` - Integer value
- `StringValue` - String value
- `BoolValue` - Boolean value
- `TimestampedBytes` - Raw bytes with timestamp

### Maritime-Specific (payloads.*)
- `VesselNavStatus` - Vessel navigation status
- `VesselType` - Vessel type classification
- `RadarReading` - Radar sensor data
- `LocationFixQuality` - GPS fix quality

### General (payloads.*)
- `Alarm` - Alarm messages
- `Audio` - Audio data
- `Geojson` - Geographic JSON data
- `NetworkStatus` - Network connectivity
- `SensorStatus` - Sensor health

See the [Keelson repository](https://github.com/RISE-Maritime/keelson/tree/main/messages/payloads) for complete definitions.

## Next Steps

- Explore the Keelson JS SDK documentation
- Read the [Keelson Protocol Specification](https://github.com/RISE-Maritime/keelson/blob/main/docs/protocol-specification.md)
- Check out the subjects registry for standard naming conventions
- Build your own flows integrating with sensors, databases, or APIs
- Experiment with different protobuf message types
