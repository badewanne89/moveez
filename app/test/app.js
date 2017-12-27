process.env.NODE_ENV = 'test'

var chai = require("chai"),
    chaitHttp = require("chai-http"),
    app = require("../app.js"),
    should = chai.should()
    
chai.use(chaitHttp)

describe("Movees", () => {
    it("it should GET the welcome message", (done) => {
        chai.request(app)
        .get("/")
        .end((err, res) => {
            res.should.have.status(200)
            res.body.should.have.property("message").eql("Welcome to moveez!")
            done()
        })
    })
})