# About
[![Build Status](https://dev.azure.com/Schdieflaw0018/moveez/_apis/build/status/moveez?branchName=master)](https://dev.azure.com/Schdieflaw0018/moveez/_build/latest?definitionId=2&branchName=master)

`Moveez` is a service to keep track of the movies you would like to watch in future. It shows you the ratings from sites like iMDB.com and Rottentomatoes.com.

[Visit us](https://www.moveez.de)

Future updates might include:
- It even alerts you when a movie is running in cinema or is available on a VoD-plattform of your choice.
- Furthermore you can browse your list by ratings, release date or genre.
- an own score calculated by the individual ratings of all moveez-users.

![Screenshot](https://github.com/schdief/moveez/blob/master/screenshot.png)

# Development
* `npm install` to install dependencies
* `npm run dev` to start app locally
* `npm test` to run integration tests locally
* `npm run cy:open` to open cypress.io to manage acceptance tests

## Azure DevOps
We have switched from Jenkins to Azure DevOps. You can find the workspace [here](https://dev.azure.com/Schdieflaw0018/moveez/).
Within Azure DevOps we are using Azure Pipelines to build and release moveez.
* The build configuration is done `azure-pipelines.yml` per service.
* The release is currently configured in GUI due to lack of support.

# Stack
This app consists of multiple microservices, all based on [Express](https://expressjs.com/). They can be found in the `services` directory.
To deploy and run the services we are using `docker-compose.yml`.

## Database
As already stated we are using MongoDB as our database. Our test databases are running on mlabs.com, our production database runs locally with docker.

### Production
#### Setup
It is accessed via user-defined networking, defined with `docker network create -d bridge moveez_net`

To start the production database use the following command and use different credentials:
```
sudo docker run -e MONGO_INITDB_DATABASE=moveez_db_prod -e MONGO_INITDB_ROOT_USERNAME=SECRET -e MONGO_INITDB_ROOT_PASSWORD=SECRET --network=moveez_net --log-driver=gelf --log-opt gelf-address=udp://0.0.0.0:12201 --log-opt tag=mongodb --name mongodb --restart unless-stopped -d -p 27017:27017 -v mongodbdata:/data/db schdieflaw/mongo --smallfiles --auth
```

Initially create the database and the user for the application to access it with, but use different credentials:
```
mongo --host mongodb://secret:secret@localhost:27017
use moveez_db_prod
db.createUser({ user: "moveez", pwd: "secret", roles: [{ role: "readWrite", db: "moveez_db_prod" }]})
exit
```

#### Image
To enable healtchecks we need our own docker image with the following Dockerfile:
```
FROM mongo
LABEL maintainer="schdief.law@gmail.com"
# add healtcheck for auto-repair
HEALTHCHECK --interval=2m --timeout=10s --retries=3 CMD mongo --quiet --eval 'quit(db.runCommand({ ping: 1 }).ok ? 0 : 2)' || exit 1
```

#### Backup
The database is backed up via a cron job on our docker host. The crontab `crontab -e or -l` looks like this:
```
0 * * * * /bin/bash /bin/moveez_db_backup.sh >> /var/log/moveez_db_backup.log 2>&1
```

The script looks like this:
```
#!/bin/bash
backup_name=backup_`date +%Y-%m-%d-%H:%M:%S`.gz

#dump full database with mongodump inside container and push it onto volume to access it from host
docker exec mongodb mongodump --archive=/data/db/$backup_name --gzip --username SECRET --password SECRET

#push dump to aws s3
output=$(/root/.local/bin/aws s3 cp /var/lib/docker/volumes/mongodbdata/_data/$backup_name s3://moveez-prod-db-backup/)

#inform graylog about it
echo "{\"version\": \"1.1\",\"host\":\"backup\",\"short_message\":\"pushing ${backup_name} to aws s3\",\"full_message\":\"${output}\",\"tag\":\"backup\"}" | gzip | nc -u -w 1 127.0.0.1 12201

#delete local dump
rm $backup_name -f
```

For this to work you need to install the aws cli first:
```
sudo yum -y install epel-release
sudo yum -y install python-pip
pip install awscli --upgrade --user
PATH=$PATH:~/.local/bin
aws configure
AWS Access Key ID [None]: KEY
AWS Secret Access Key [None]: SECRET
Default region name [None]: eu-central-1
Default output format [None]: json
```

Furthermore you need to install netcat to push the log to graylog:
```
yum install nc -y
```

Backups are marked for deletion after 10 days and deleted 1 day later as described [here](https://www.joe0.com/2017/05/24/amazon-s3-how-to-delete-files-older-than-x-days/).

#### Recovery
The recovery is done by:
```
cd /var/lib/docker/volumes/mongodbdata/_data
aws s3 cp s3://moveez-prod-db-backup/backup_2019-01-21-16:00:01.gz backup_2019-01-21-16:00:01.gz
sudo docker exec -it mongodb /bin/bash
mongorestore --archive=backup_2019-01-21-16:00:01.gz --gzip --username SECRET --password SECRET --stopOnError --verbose --drop --dryRun
mongorestore --archive=backup_2019-01-21-16:00:01.gz --gzip --username SECRET --password SECRET --stopOnError --verbose --drop
```

## Graylog
To monitor the stack we are using graylog. You can access it via:
http://moveez.de:9000

## Setup
Elasticsearch needs the following configuration to run `sudo sysctl -w vm.max_map_count=262144`. Then start with `docker-compose up -d:
```
version: '2'
services:
  # MongoDB: https://hub.docker.com/_/mongo/
  mongodb:
    image: mongo:3
  # Elasticsearch: https://www.elastic.co/guide/en/elasticsearch/reference/6.x/docker.html
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:6.5.1
    environment:
      - http.host=0.0.0.0
      - transport.host=localhost
      - network.host=0.0.0.0
      # Disable X-Pack security: https://www.elastic.co/guide/en/elasticsearch/reference/6.x/security-settings.html#general-security-settings
      - xpack.security.enabled=false
      - xpack.watcher.enabled=false
      - xpack.monitoring.enabled=false
      - xpack.security.audit.enabled=false
      - xpack.ml.enabled=false
      - xpack.graph.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    mem_limit: 1g
  # Graylog: https://hub.docker.com/r/graylog/graylog/
  graylog:
    image: graylog/graylog:2.5
    environment:
      # CHANGE ME!
      - GRAYLOG_PASSWORD_SECRET=somepasswordpepper
      # Password: SECRET
      - GRAYLOG_ROOT_PASSWORD_SHA2=SECRET
      - GRAYLOG_WEB_ENDPOINT_URI=http://moveez.de:9000/api
    links:
      - mongodb:mongo
      - elasticsearch
    depends_on:
      - mongodb
      - elasticsearch
    ports:
      # Graylog web interface and REST API
      - 9000:9000
      # Syslog TCP
      - 514:514
      # Syslog UDP
      - 514:514/udp
      # GELF TCP
      - 12201:12201
      # GELF UDP
      - 12201:12201/udp
```

# Run
## Monitoring
To monitor our services we are using uptime robot that can be visited here:
https://uptimerobot.com/dashboard#mainDashboard

## Local
Most things are controlled via docker. To get an overview of the health of the services just run `docker ps`.

| Service | Restart | Logs |
| ------- | ------- | ---- |
| moveez  |`docker restart moveez_prod` | `docker logs moveez_prod` |
| mongo   |`docker restart mongodb` | `docker logs mongodb` |
| backup  | - | `cat /var/log/moveez_db_backup.log` |
| graylog | `docker-compose restart` | `docker-compose logs` |
| jenkins | `docker restart jenkins` | `docker logs jenkins` |