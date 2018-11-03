# About
Moveez is a service to keep track of the movies you would like to watch in future. It shows you the ratings from sites like iMDB and Rottentomato and learns from your watching habbits. It even alerts you when a movie is running in cinema or is available on a VoD-plattform of your choice. Furthermore you can browse your list by ratings, release date or genre.

Future updates might include an own score calculated by the individual ratings of all moveez-users.

Visit us at http://moveez.de

![Screenshot](https://github.com/schdief/moveez/blob/master/screenshot.png)

# Development
* `npm install` to install dependencies
* `npm run dev` to start app locally
* `npm test` to run integration tests locally
* http://uat.moveez.de is our test environment (currently needs an active build)
* `npm run cypress:open` to open cypress.io to manage acceptance tests

# Stack
An Express.js app based on Node.js with MongoDB (mlab) - in short MEN.

# Jenkins
We use Jenkins as our CI server with a Docker outside of Docker (DooD) approach, where Jenkins runs inside a container and uses the docker hosts docker daemon.
It is hosted at Hetzner Cloud based on CentOS 7 and can be visited here:
http://jenkins.moveez.de/job/moveez/

## Docker
[Docker-Setup](https://docs.docker.com/install/linux/docker-ce/centos/#install-using-the-repository)
```
sudo yum install -y yum-utils \
  device-mapper-persistent-data \
  lvm2

sudo yum-config-manager \
    --add-repo \
    https://download.docker.com/linux/centos/docker-ce.repo

sudo yum install docker-ce
```
[Docker Post-Install](https://docs.docker.com/install/linux/linux-postinstall/)

`sudo systemctl enable docker`

## Jenkins-Image
Build Jenkins with the following Dockerfile, but change the gid (here 994), to what it is on your docker host - find out with `getent group | grep "docker"`.
```
FROM jenkins/jenkins:lts
LABEL maintainer "schdief.law@gmail.com"
USER root
RUN apt-get update && apt-get install g++ build-essential -y && \
apt-get -y install apt-transport-https \
     ca-certificates \
     curl \
     gnupg2 \
     software-properties-common && \
curl -fsSL https://download.docker.com/linux/$(. /etc/os-release; echo "$ID")/gpg > /tmp/dkey; apt-key add /tmp/dkey$
add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/$(. /etc/os-release; echo "$ID") \
   $(lsb_release -cs) \
   stable" && \
apt-get update && \
apt-get -y install docker-ce
RUN /usr/local/bin/install-plugins.sh docker-slaves workflow-aggregator:latest
RUN /usr/local/bin/install-plugins.sh docker-slaves blueocean:latest
RUN /usr/local/bin/install-plugins.sh docker-slaves pipeline-utility-steps:latest
RUN /usr/local/bin/install-plugins.sh docker-slaves http_request:latest
RUN /usr/local/bin/install-plugins.sh docker-slaves nodejs:latest
RUN /usr/local/bin/install-plugins.sh docker-slaves sonar:latest
RUN /usr/local/bin/install-plugins.sh docker-slaves mailer:latest
RUN /usr/local/bin/install-plugins.sh docker-slaves ssh-slaves:latest
RUN /usr/local/bin/install-plugins.sh docker-slaves pipeline-stage-view:latest
RUN /usr/local/bin/install-plugins.sh docker-slaves pipeline-github-lib:latest
RUN /usr/local/bin/install-plugins.sh docker-slaves github-branch-source:latest
RUN /usr/local/bin/install-plugins.sh docker-slaves github:latest
RUN /usr/local/bin/install-plugins.sh docker-slaves git:latest
RUN /usr/local/bin/install-plugins.sh docker-slaves timestamper:latest
RUN /usr/local/bin/install-plugins.sh docker-slaves credentials-binding:latest
RUN groupadd -g 994 docker-host
RUN usermod -a -G docker-host jenkins
USER jenkins
```

Start the build with: `docker build -t schdief/jenkins .`

Run jenkins in background

```
sudo docker run -d --name jenkins -p 8080:8080 -p 50000:50000 -v /var/run/docker.sock:/var/run/docker.sock -v jenkins_home:/var/jenkins_home schdief/jenkins
```

## Jenkins-Config
### Plugins
The pipeline requires the following configuration in Jenkins:
- https://wiki.jenkins.io/display/JENKINS/Pipeline+Utility+Steps+Plugin
- https://plugins.jenkins.io/timestamper
- https://wiki.jenkins.io/display/JENKINS/HTTP+Request+Plugin
- https://wiki.jenkins.io/display/JENKINS/NodeJS+Plugin
	+ add a nodejs installation in jenkins tool config named "node" (version 10.4 is needed)
- https://plugins.jenkins.io/sonar
	+ add SonarQube Scanner installation in jenkins tool config named "sonarqube"
	+ add a sonarqube server to manage jenkins named "sonarcloud"
- https://wiki.jenkins.io/display/JENKINS/Azure+App+Service+Plugin
	+ add microsoft azure service principal credentials named "azure", howto: https://docs.microsoft.com/en-us/cli/azure/create-an-azure-service-principal-azure-cli?view=azure-cli-latest
	+ create azure app service instance: https://docs.microsoft.com/en-us/azure/app-service/containers/quickstart-custom-docker-image
	+ add a deployment slot "test" for testing

### Credentials
You also need to define credentials for github named "github" (ideally via Blue Ocean "add pipeline").
Furthermore you need to define credentials for dockerhub named "dockerhub".