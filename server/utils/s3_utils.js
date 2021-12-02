import dotenv from 'dotenv'
import fs from 'fs'
import AWS from 'aws-sdk'
import Bluebird from 'bluebird'

dotenv.config()

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY

AWS.config.setPromisesDependency(Bluebird)
AWS.config.update({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
    region: region
})

const s3 = new AWS.S3()

async function uploadToS3(image, username, mozaicName) {

    const base64Data = new Buffer.from(image.replace(/^data:image\/\w+;base64,/, ""), 'base64')

    // Getting the file type, ie: jpeg, png or gif
    const type = image.split(';')[0].split('/')[1]

    const params = {
        Bucket: bucketName,
        Key: `${username}_${mozaicName}.${type}`,
        Body: base64Data,
        ContentEncoding: 'base64',
        ContentType: `image/${type}`
    }

    let location = '';
    let key = '';
    try {
        const { Location, Key } = await s3.upload(params).promise();
        location = Location;
        key = Key;
    } catch (error) {
        console.log(error)
    }

    return key
}

async function downloadFromS3(fileKeys) {

    let imagesFromS3 = []
    for (const fileKey of fileKeys) {
        
        var imageFromS3 = await s3.getObject({Key: fileKey._id, Bucket: bucketName}).promise()
        imagesFromS3.push(imageFromS3)
    }

    return imagesFromS3
}

async function deleteFromS3(fileKeys) {

    let numDeleted = 0
    for (const fileKey of fileKeys) {
        
        var imageFromS3 = await s3.deleteObject({Key: fileKey._id, Bucket: bucketName}).promise()
        numDeleted++
    }

    return numDeleted
}

export { uploadToS3, downloadFromS3, deleteFromS3 }