# Use the official Node-RED base image
FROM nodered/node-red:latest

RUN npm install @freol35241/nodered-contrib-zenoh
# RUN npm install keelson-js