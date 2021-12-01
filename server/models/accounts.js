import mongoose from 'mongoose'
import passportLocalMongoose from 'passport-local-mongoose'

var Schema = mongoose.Schema

var AccountSchema = new Schema({
    username: String,
    password: String
})

AccountSchema.plugin(passportLocalMongoose)

var accountsDB = mongoose.connection.useDb('accounts')
var AccountModel = accountsDB.model('Account', AccountSchema)

export {AccountModel}