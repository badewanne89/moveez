//DEPENDENCIES
var express = require("express"),
    app = express(),
    morgan = require("morgan")

//LOGGING
//don't show log when it is test
if(process.env.NODE_ENV !== "test"){
    //use morgan to log at command line with Apache style
    app.use(morgan("combined"))
}

//ROUTES
app.get("/", (req, res) => res.json({message: "Welcome to moveez!"}))

//SERVER
app.listen(process.env.PORT, process.env.IP, () => console.log("Moveez started on " + process.env.IP + ":" + process.env.PORT))

//expose for integration testing with mocha
module.exports = app