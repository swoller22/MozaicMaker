import { joinImages } from 'join-images'
import sharp from 'sharp'
import cd from 'color-difference'
import { extractRGBAverage, resizeImages, compileImageRows } from '../utils/image_processing.js'
import { getAverageColor } from 'fast-average-color-node'
import { myMathHelper } from '../utils/math_utils.js'

async function findBestMatchesByBruteForce(largeImageBuffer, smallImageBuffers, configs) {

    let largeImageWidth = configs.largeImageWidth
    let largeImageHeight = configs.largeImageHeight
    let smallImageSize = configs.smallImageSize

    let resizedLargeImage = await sharp(largeImageBuffer)
        .resize({ width: largeImageWidth, height: largeImageHeight })
        .toBuffer()

    let resizedImagesToGenerateFrom = await resizeImages(smallImageBuffers, smallImageSize)

    let numberOfRows = Math.floor(largeImageHeight / smallImageSize)
    let numberOfCols = Math.floor(largeImageWidth / smallImageSize)

    var bestMatches = []
    var distances = []
    for (let row = 0; row < numberOfRows; row++) {
        for (let col = 0; col < numberOfCols; col++) {
            let blockAverage = await extractRGBAverage(resizedLargeImage, col * smallImageSize, row * smallImageSize, smallImageSize)
            let bestMatch = await findBestMatch(blockAverage, resizedImagesToGenerateFrom)

            distances.push(bestMatch.bestMatchVal)
            
            console.log(`${row},${col} match found`)
            bestMatches.push(bestMatch.bestMatch.data)
        }
    }

    let matchInfo = {
        averageDistance: myMathHelper.getAverage(distances),
        worstDistance: myMathHelper.getWorstMatchDistance(distances)
    }

    // Now join the images
    let rowsOfImages = await compileImageRows(bestMatches, numberOfRows, numberOfCols)
    try {
        let out = await joinImages(rowsOfImages, { 'direction': 'vertical' })
        let buffer = await out.png().toBuffer({resolveWithObject: true})
        return {buffer: buffer, matchInfo: matchInfo}
    } catch(error) {
        console.error(error)
    }
}

async function findBestMatch(toMatch, images) {

    let bestMatchVal = 101;
    let bestMatch = null;
    for (const image of images) {

        const color = await getAverageColor(image.data);

        let distance = cd.compare(toMatch.hex, color.hex)
        if (distance < bestMatchVal) {
            bestMatch = image
            bestMatchVal = distance
        }
    }
    return {bestMatch, bestMatchVal}
}

export { findBestMatchesByBruteForce }