# About
Is a webbased service to keep track of the movies you would like to watch in future. It shows you the ratings from sites like IMDB and Rottentomato and learns from your watching habbits. It even alerts you when a movie is running in cinema or is available on a VoD-plattform of your choice. Furthermore you can browse your list by ratings, release date or genre.

Future updates might include an own score calculated by the individual ratings of all moveez-users.

# Development
"npm install" to install dependencies

"npm run dev" to start app locally

"npm test" to run integration tests locally

# Stack
An Express.js app based on Node.js with MongoDB (mlab).

# Jenkins
The pipeline requires the following configuration in Jenkins:
- https://wiki.jenkins.io/display/JENKINS/Pipeline+Utility+Steps+Plugin
- https://plugins.jenkins.io/timestamper
- https://wiki.jenkins.io/display/JENKINS/HTTP+Request+Plugin
- https://wiki.jenkins.io/display/JENKINS/NodeJS+Plugin
	+ add a nodejs installation in jenkins tool config named "node")
- https://plugins.jenkins.io/sonar
	+ add sonar runner installation in jenkins tool config named "sonarqube"
	+ add a sonarqube server to manage jenkins named "sonarcloud"
- https://wiki.jenkins.io/display/JENKINS/Azure+App+Service+Plugin
	+ add microsoft azure service principal credentials named "azure", howto: https://docs.microsoft.com/en-us/cli/azure/create-an-azure-service-principal-azure-cli?view=azure-cli-latest
	+ create azure app service instance: https://docs.microsoft.com/en-us/azure/app-service/containers/quickstart-custom-docker-image
	+ add a deployment slot "test" for testing

You also need to define credentials for github named "github" (ideally via Blue Ocean "add pipeline").