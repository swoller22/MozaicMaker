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

async function checkDuplicate(mozaicName, username) {

    const result = await ImageModel.exists({_id: { $regex: `${username}_${mozaicName}.*`}})
    return result
}

async function deleteAccountFromMongo(username) {

    const result = await AccountModel.deleteOne({username: username})
    return result
}

async function changePassword(username, currentPassword, newPassword) {

    const user = await AccountModel.findOne({username: username})

    let success = true
    try {
        var passwordChanged = await user.changePassword(currentPassword, newPassword)
    } catch (error) {
        console.error(error)
        success = false
    }
    return success
}

export {storeKeyToMongo, getImageKeysForAccount, deleteKeysInMongo, deleteAccountFromMongo, changePassword, checkDuplicate}