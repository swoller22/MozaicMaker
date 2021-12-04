import express from 'express'
import multer from 'multer'
import { createMozaic as createMozaicWithBruteForce } from '../image_processing/brute_force.js'
import { findBestMatchesByHillClimbing as findBestMatchesByHillClimbingHSV } from '../image_processing/hill_climbing_hsv.js'
import { createMozaic as createMozaicByHillClimbingRGB } from '../image_processing/hill_climbing_rgb.js'
import { getImageData } from '../image_processing/input_image_analysis.js'

const upload = multer()

const image_processing_router = express.Router()

image_processing_router.route('/')
    .all((req, res, next) => {
        console.log("Sent to image processor...")
        next()
    })
    .post(upload.any(), async (req, res) => {
        let configs = {
            largeImageWidth: parseInt(req.body.largeImageWidth),
            largeImageHeight: parseInt(req.body.largeImageHeight),
            smallImageSize: parseInt(req.body.smallImageSize),
        }

        let smallImageBuffers = []
        let largeImageBuffer = null;
        req.files.forEach(file => {
            if (file.fieldname === 'largeImageFile') largeImageBuffer = file.buffer
        })
        req.files.forEach(file => {
            if (file.fieldname === 'smallImageFiles') smallImageBuffers.push(file.buffer)
        });
        
        var result = null
        switch (req.body.algorithm) {
            case 'brute':
                result = await createMozaicWithBruteForce(
                    largeImageBuffer,
                    smallImageBuffers,
                    configs)
                break
            case 'rgb':
                configs.climbDistance = parseInt(req.body.climbDistance)
                    
                result = await createMozaicByHillClimbingRGB(
                    largeImageBuffer,
                    smallImageBuffers,
                    configs)
                break
            case 'hsv':

                configs.climbDistance = parseInt(req.body.climbDistance)
                configs.numberOfClimbers = parseInt(req.body.numberOfClimbers)

                result = await findBestMatchesByHillClimbingHSV(
                    largeImageBuffer,
                    smallImageBuffers,
                    configs)
                break
            default:
                console.log("Algorithm type not recognized.")
        }

        res.send({ data: result.buffer.data.toString('base64'), matchInfo: result.matchInfo })
    })

image_processing_router.route('/analysis')
    .all((req, res, next) => {
        console.log("Sent to image processor analysis...")
        next()
    })
    .post(upload.any(), async (req, res) => {

        let configs = {
            largeImageWidth: parseInt(req.body.largeImageWidth),
            largeImageHeight: parseInt(req.body.largeImageHeight),
            smallImageSize: parseInt(req.body.smallImageSize)
        }

        let smallImageBuffers = []
        let largeImageBuffer = null;
        req.files.forEach(file => {
            if (file.fieldname === 'largeImageFile') largeImageBuffer = file.buffer
        })
        req.files.forEach(file => {
            if (file.fieldname === 'smallImageFiles') smallImageBuffers.push(file.buffer)
        })

        var result = await getImageData(
            largeImageBuffer,
            smallImageBuffers,
            configs)

        res.send(result)
    })

export { image_processing_router }