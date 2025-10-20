#!/bin/sh

# Generate env.js from template with actual environment variables
envsubst < /usr/share/nginx/html/env.template.js > /usr/share/nginx/html/env.js

# Start nginx
exec nginx -g "daemon off;"
