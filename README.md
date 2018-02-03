# moveez
Is a webbased service to keep track of the movies you would like to watch in future. It shows you the ratings from sites like IMDB and Rottentomato and learns from your watching habbits. It even alerts you when a movie is running in cinema or is available on a VoD-plattform of your choice. Furthermore you can browse your list by ratings, release date or genre.

Future updates might include an own score calculated by the individual ratings of all moveez-users.

# Jenkins
The pipeline requires the following configuration in Jenkins:
- https://wiki.jenkins.io/display/JENKINS/Pipeline+Utility+Steps+Plugin
- https://wiki.jenkins.io/display/JENKINS/NodeJS+Plugin (+ add a nodejs installation in jenkins tool config with "node-gyp" and "gcc" as global package)