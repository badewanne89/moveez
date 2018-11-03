FROM node:latest
LABEL maintainer="schdief.law@gmail.com"

# making release name available for app to display
ARG RELEASE
ENV RELEASE ${RELEASE}

# working directory for moveez
WORKDIR /usr/src/app

# install dependencies from package.json
COPY package*.json ./
# TODO: only install prod deps not dev
RUN npm install

# bundle app source
# TODO: only use necessary stuff for image
COPY . .

EXPOSE 443

# start moveez
CMD [ "npm", "start" ]
