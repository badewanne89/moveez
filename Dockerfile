FROM node:latest
LABEL maintainer "schdief.law@gmail.com"

# making release name available for app to display
ARG RELEASE
ENV RELEASE ${RELEASE}

# working directory for moveez
WORKDIR /usr/src/app

# install dependencies from package.json
COPY package*.json ./
RUN npm install

# bundle app source
COPY . .

EXPOSE 80

# start moveez
CMD [ "npm", "start" ]
