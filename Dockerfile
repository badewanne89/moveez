FROM node:latest
LABEL maintainer "schdief.law@gmail.com"

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
