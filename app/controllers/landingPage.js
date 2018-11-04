const landingPage = (req, res) => {
    if(req.get('Accept') === "text/json"){
        res.json({message: "Welcome to " + process.env.RELEASE + "!"});
        return;
    }
    res.render("landingPage/index");
};

module.exports = {
    landingPage
}