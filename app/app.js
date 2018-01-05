//DEPENDENCIES
var express = require("express"),
    app = express(),
    morgan = require("morgan"),
    title = require("./controllers/title"),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    config = require("config") //load database configuration from config file

//LOGGING
//don't show log when it is test
if(process.env.NODE_ENV !== "test"){
    //use morgan to log at command line with Apache style
    app.use(morgan("combined"))
}

//DATABASE
var dbConnectionString = config.dbProtocol + "://" + config.dbUser + ":" + config.dbPassword + "@" + config.dbHost + ":" + config.dbPort + "/" + config.dbName
mongoose.connect(dbConnectionString, config.dbConnectionOptions)
var db = mongoose.connection
db.on("error", console.error.bind(console, "connection error:"))

//parse application/json and look for raw text
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.text())
app.use(bodyParser.json({type: "application/json"}))

//VIEW
app.set("view engine", "ejs")
app.use(express.static(__dirname + "/views/public"))

//ROUTES
//index
app.get("/", (req, res) => res.json({message: "Welcome to moveez!"}))
//title RESTful routes
app.route("/title")
    .get(title.getTitles)
    .post(title.postTitle)

//SERVER
//PORT is defined by environment variable or 8081
const PORT = process.env.PORT || 8081
const HOST = '0.0.0.0'
app.listen(PORT, HOST, () => {
    console.log("Moveez started on " + HOST + ":" + PORT)
    console.log("mode: " + process.env.NODE_ENV)
    console.log("db: " + dbConnectionString)
})

//expose for integration testing with mocha
module.exports = app
