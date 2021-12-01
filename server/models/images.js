import mongoose from 'mongoose'

var Schema = mongoose.Schema

var ImageSchema = new Schema({
    _id: String,
     username: String
})

var imagesDB = mongoose.connection.useDb('images')
var ImageModel = imagesDB.model('Image', ImageSchema)

export {ImageModel}