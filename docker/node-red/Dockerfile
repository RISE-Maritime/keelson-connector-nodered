FROM nodered/node-red:latest

USER root

# Install build dependencies (needed for native modules in keelson-js)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Create directory for custom nodes
RUN mkdir -p /usr/src/node-red/custom-nodes

# Copy custom nodes
COPY node-red/custom-nodes/keelson-envelope /usr/src/node-red/custom-nodes/keelson-envelope

# Install custom node dependencies (includes keelson-js SDK)
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
