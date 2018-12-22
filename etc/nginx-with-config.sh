#!/bin/bash -e

docker run \
    --name nginx-linter-test-container \
    -v "`pwd`/$1:/etc/nginx/nginx.conf:ro" \
    -p 8080:80 \
    --rm \
    nginx
