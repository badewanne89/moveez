var Title = require("../models/title"),
    mongoose = require("mongoose"),
    HttpStatus = require("http-status-codes")

//CREATE POST /title to add a new title
function postTitle(req, res){
    //metrics, but not during test
    if(process.env.NODE_ENV !== "test"){
        console.log("metrics.postTitle")
    }
    var newTitle = new Title(req.body.title)
    newTitle.save((err, title) => {
        if(err) {
            res
                .status(HttpStatus.NOT_FOUND)
                .send(err)
        } else {
            //respond with JSON when asked (for API calls and integration testing), otherwise render HTML
            if(req.get('Accept') === "text/json"){
                res
                    .status(HttpStatus.CREATED)
                    .json({message: "Title successfully added!", title})
            } else {
                res.redirect("title")
            }
        }
    })
}

//READ GET /title to retrieve all titles
function getTitles(req, res){
    //metrics, but not during test
    if(process.env.NODE_ENV !== "test"){
        console.log("metrics.getTitles")
    }
    var query = Title.find({})
    query.exec((err, titles) => {
        if(err) {
            res
                .status(HttpStatus.NOT_FOUND)
                .send(err)
        } else {
            //respond with JSON when asked (for API calls and integration testing), otherwise render HTML
            if(req.get('Accept') === "text/json"){
                res.json(titles)
            } else {
                res.render("title/index", {titles: titles})
            }
        }
    })
}

//READ GET /title/:id to retrieve a title
function getTitle(req, res){
    //metrics, but not during test
    if(process.env.NODE_ENV !== "test"){
        console.log("metrics.getTitle")
    }
    var query = Title.findById(req.params.id)
    query.exec((err, title) => {
        if(err) {
            res
                .status(HttpStatus.NOT_FOUND)
                .send(err)
        } else {
            //respond with JSON when asked (for API calls and integration testing), otherwise render HTML
            if(req.get('Accept') === "text/json"){
                res.json(title)
            } else {
                res.redirect("/title")
            }
        }
    })
}

//UPDATE PUT /title/:id to update a title
function updateTitle(req, res){
    //metrics, but not during test
    if(process.env.NODE_ENV !== "test"){
        console.log("metrics.updateTitle")
    }
    var query = Title.findByIdAndUpdate(req.params.id, req.body.title)
    query.exec((err, updateTitle) => {
        if(err) {
            res
                .status(HttpStatus.NOT_FOUND)
                .send(err)
        } else {
                //respond with JSON when asked (for API calls and integration testing), otherwise render HTML
                if(req.get('Accept') === "text/json"){
                    res.json({message: "Title successfully updated!", title})
                } else {
                    res.redirect("/title")
                }
        }
    })
}

//export all functions
module.exports = { getTitles, getTitle, postTitle, updateTitle };