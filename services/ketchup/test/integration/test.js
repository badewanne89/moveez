var chai = require("chai"),
    chaitHttp = require("chai-http"),
    should = chai.should(),
    app = require("../../ketchup.js")

chai.use(chaitHttp)

describe("Ketchup integration tests", () => {
    it("it should deny requests without an ID", (done) => {
        chai.request(app)
            .get("/")
            .end((err, res) => {
                res.should.have.status(417)
                res.text.should.equal("ERR: URL missing 😭")
                done()
        })
    })
    it("it should fail at finding a rating for a corrupt ID", (done) => {
        chai.request(app)
            .get("/termü")
            .end((err, res) => {
                res.should.have.status(500)
                res.text.should.equal("ERR: got a 404 for https://www.rottentomatoes.com/m/termü 😭😭😭")
                done()
        })
    })
    //TODO: test for movie without rating
    it("it should return a valid rating for 'Terminator 2'", (done) => {
        chai.request(app)
            .get("/terminator_2_judgment_day")
            .end((err, res) => {
                res.should.have.status(200)
                res.body.tomatoUserRating.should.equal("94")
                done()
        })
    })
})