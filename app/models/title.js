var mongoose = require("mongoose"),
    Schema = mongoose.Schema
    
//schema definition for title
var TitleSchema = new Schema(
    {
        name: {type: String, required: true},
        createdAt: {type: Date, default: Date.now},
        seen: {type: Boolean, default: false},
        seenAt: {type: Date}
    }
)

//set the createdAt parameter equal to the current time
TitleSchema.pre("save", next => {
    var now = new Date()
    if(!this.createdAt){
        this.createdAt = now
    }
    next()
})

module.exports = mongoose.model("title", TitleSchema)