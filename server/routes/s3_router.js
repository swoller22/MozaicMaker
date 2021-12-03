import express from 'express'

import { uploadToS3, downloadFromS3, deleteFromS3 } from '../utils/s3_utils.js'
import { storeKeyToMongo, getImageKeysForAccount, deleteKeysInMongo, checkDuplicate } from '../utils/mongo_utils.js'

const s3_router = express.Router();

s3_router.route('/')
    .all((req, res, next) => {
        console.log("Accessing s3...");
        next()
    })
    .post(async (req, res, next) => {

        let isDuplicate = await checkDuplicate(req.body.mozaicName, req.user.username)
        if(isDuplicate || req.body.image.length == 0) {
            res.json({success: false})
            return
        } else {
            const key = await uploadToS3(req.body.image, req.user.username, req.body.mozaicName)
            storeKeyToMongo(key, req.user.username)
            res.send(key)
        }
    })
    .get(async (req, res) => {

        const imageKeys = await getImageKeysForAccount(req.user.username)
        console.log(imageKeys)
        const result = await downloadFromS3(imageKeys)
        console.log(result)
        res.send(result)
    })
    .delete(async (req, res) => {

        const imageKeys = await getImageKeysForAccount(req.user.username)
        const resultS3 = await deleteFromS3(imageKeys)
        const resultMongo = await deleteKeysInMongo(req.user.username)
        res.send(`${resultS3} images deleted`)
    })

export { s3_router }