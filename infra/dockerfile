FROM node:latest
LABEL maintainer "schdief.law@gmail.com"
HEALTHCHECK --interval=5s\
            --timeout=5s\
            CMD curl http://127.0.0.1:8080 || exit 1
EXPOSE 8080