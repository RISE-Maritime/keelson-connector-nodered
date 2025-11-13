FROM nodered/node-red:latest

USER root

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Create directories for protos and custom nodes
RUN mkdir -p /usr/src/node-red/protos/payloads
RUN mkdir -p /usr/src/node-red/custom-nodes

# Copy proto definitions
COPY protos/Envelope.proto /usr/src/node-red/protos/
COPY protos/subjects.yaml /usr/src/node-red/protos/
COPY protos/payloads/*.proto /usr/src/node-red/protos/payloads/

# Copy custom nodes
COPY node-red/custom-nodes/keelson-envelope /usr/src/node-red/custom-nodes/keelson-envelope

# Install custom node dependencies
WORKDIR /usr/src/node-red/custom-nodes/keelson-envelope
RUN npm install

# Switch back to node-red user
USER node-red

# Install the custom nodes into Node-RED
WORKDIR /usr/src/node-red
RUN npm install /usr/src/node-red/custom-nodes/keelson-envelope

# Expose Node-RED port
EXPOSE 1880

# Start Node-RED
CMD ["node-red"]
