FROM node:alpine as test
LABEL maintainer="schdief.law@gmail.com"
LABEL service="moveez"

# install dependencies (without cypress)
COPY package*.json ./
RUN npm install --no-optional

# run integration test with mocha
RUN npm test

# TODO: add sonarqube

FROM node:alpine as build
LABEL maintainer="schdief.law@gmail.com"
LABEL service="moveez"

# TODO: reuse dependencies to speed up build
# install dependencies (without cypress)
COPY package*.json ./
RUN npm install --no-optional

# build frontend javascript (react)
RUN npm run babel
RUN npm run webpack

FROM node:alpine AS final
LABEL maintainer="schdief.law@gmail.com"
LABEL service="moveez"

# making release name available for app to display
ARG RELEASE
ENV RELEASE ${RELEASE}

# working directory for moveez
WORKDIR /usr/src/app

# install dependencies from package.json, but no dev
COPY package*.json ./
RUN npm install --only=prod

# bundle app source
COPY . .

# get frontend javascript (react) from previos stage
COPY -from=build dist/app app/

EXPOSE 443

#TODO: install curl
# add healtcheck for auto-repair
#HEALTHCHECK --interval=5m --timeout=10s --retries=5 CMD curl --silent --fail localhost:443 || exit 1

# start moveez
CMD [ "npm", "start" ]