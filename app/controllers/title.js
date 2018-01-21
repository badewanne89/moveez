var Title = require("../models/title"),
    mongoose = require("mongoose")

//INDEX GET /title to retrieve all titles
function getTitles(req, res){
    var query = Title.find({})
    query.exec((err, titles) => {
        if(err) {
            res.send(err)
        } else {
            //respond with JSON when asked (for API calls and integration testing), otherwise render HTML
            if(req.get('Accept') === "text/json"){
                res.json(titles)
            } else {
                console.log("metrics.getTitles")
                res.render("title/index", {titles: titles})
            }
        }
    })
}

//CREATE POST /title to add a new title
function postTitle(req, res){
    var newTitle = new Title(req.body.title)
    newTitle.save((err, title) => {
        if(err) {
            res.send(err)
        } else {
            //respond with JSON when asked (for API calls and integration testing), otherwise render HTML
            if(req.get('Accept') === "text/json"){
                res.json({message: "Title successfully added!", title})
            } else {
                console.log("metrics.postTitle")
                res.redirect("title")
            }
        }
    })
}

//export all functions
module.exports = { getTitles, postTitle };