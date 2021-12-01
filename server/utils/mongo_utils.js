import { ImageModel } from '../models/images.js'

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

export {storeKeyToMongo, getImageKeysForAccount, deleteKeysInMongo}