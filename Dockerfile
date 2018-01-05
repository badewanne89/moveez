FROM node:latest
LABEL maintainer "schdief.law@gmail.com"

# working directory for moveez
WORKDIR /usr/src/app

# install dependencies from package.json
COPY package*.json ./
RUN npm install

# bundle app source
COPY . .

EXPOSE 8081

# start moveez
CMD [ "npm", "start" ]
