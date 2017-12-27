process.env.NODE_ENV = 'test'

var chai = require("chai"),
    chaitHttp = require("chai-http"),
    app = require("../app.js"),
    should = chai.should(),
    mongoose = require("mongoose"),
    Title = require("../models/title")
    
chai.use(chaitHttp)

describe("Moveez integration tests", () => {
    beforeEach((done) => {
        Title.remove({}, (err) => { 
           done();         
        });     
    });
    it("it should GET the welcome message", (done) => {
        chai.request(app)
        .get("/")
        .end((err, res) => {
            res.should.have.status(200)
            res.body.should.have.property("message").eql("Welcome to moveez!")
            done()
        })
    })
    describe("Titles", () => {
        it("it should GET the title list", (done) => {
            chai.request(app)
            .get("/title")
            .end((err, res) => {
                res.should.have.status(200)
                res.body.should.be.a('array');
                res.body.length.should.be.eql(0);
                done()
            })
        })
        it("it should GET the form to add a new title", (done) => {
            chai.request(app)
            .get("/title/new")
            .end((err, res) => {
                res.should.have.status(200)
                done()
            })
        })
        it("it should POST a title", (done) => {
            var body = {
                title: {
                    name: "Inception"    
                }
            }
            chai.request(app)
            .post("/title")
            .send(body)
            .end((err, res) => {
                res.should.have.status(200)
                res.body.should.be.a("object")
                res.body.should.have.property("message").eql("Title successfully added!")
                res.body.title.should.have.property("name")
                res.body.title.should.have.property("_id")
                res.body.title.should.have.property("createdAt")
                done()
            })
        })
    })
})