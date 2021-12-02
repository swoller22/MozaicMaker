import { ImageModel } from '../models/images.js'
import { AccountModel } from '../models/accounts.js'

function storeKeyToMongo(key, username) {
    var newImageKey = new ImageModel()
    newImageKey._id = key
    newImageKey.username = username
    newImageKey.save()
}

async function getImageKeysForAccount(username) {

    const results = await ImageModel.find({username: username})
    return results
}

async function deleteKeysInMongo(username) {

    const results = await ImageModel.deleteMany({username: username})
    return results
}

async function deleteAccountFromMongo(username) {

    const result = await AccountModel.deleteOne({username: username})
    return result
}

export {storeKeyToMongo, getImageKeysForAccount, deleteKeysInMongo, deleteAccountFromMongo}