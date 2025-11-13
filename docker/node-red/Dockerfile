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

# Install the custom nodes into Node-RED (still as root to avoid permission issues)
WORKDIR /usr/src/node-red
RUN npm install /usr/src/node-red/custom-nodes/keelson-envelope

# Fix ownership of installed node modules
RUN chown -R node-red:node-red /usr/src/node-red/node_modules

# Switch to node-red user for runtime
USER node-red

# Expose Node-RED port
EXPOSE 1880

# Start Node-RED
CMD ["node-red"]
