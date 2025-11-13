FROM nodered/node-red:latest

USER root

# Install build dependencies (needed for native modules in keelson-js)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git

# Copy custom nodes to a temporary location
COPY node-red/custom-nodes /usr/src/node-red/custom-nodes

# Copy package.json to the WORKDIR so npm builds all
# of your added nodes modules for Node-RED
WORKDIR /data
COPY package.json /data
RUN npm install --unsafe-perm --no-update-notifier --no-fund --only=production

# Fix ownership of the data directory
RUN chown -R node-red:node-red /data

# Switch to node-red user for runtime
USER node-red

# Set working directory back to Node-RED default
WORKDIR /usr/src/node-red

# Expose Node-RED port
EXPOSE 1880

# Start Node-RED
CMD ["node-red"]
