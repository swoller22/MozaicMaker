import { joinImages } from 'join-images'
import sharp from 'sharp'
import cd from 'color-difference'
import { extractRGBAverage, resizeImages, compileImageRows } from '../utils/image_processing.js'
import { getAverageColor } from 'fast-average-color-node'
import { myMathHelper } from '../utils/math_utils.js'

/**
 * Create mozaic using the Brute Force algorithm
 * 
 * @param largeImageBuffer      Image data buffer for the large image
 * @param smallImageBuffers     Image data buffers for the smaller images
 * @param configs               Configuration data
 * @returns                     Mozaic image data buffer
 */
async function createMozaic(largeImageBuffer, smallImageBuffers, configs) {

    let largeImageWidth = configs.largeImageWidth
    let largeImageHeight = configs.largeImageHeight
    let smallImageSize = configs.smallImageSize

    let resizedLargeImage = await sharp(largeImageBuffer)
        .resize({ width: largeImageWidth, height: largeImageHeight })
        .toBuffer()

    // Resize the small images to fit inside of the large image blocks
    let resizedImagesToGenerateFrom = await resizeImages(smallImageBuffers, smallImageSize)

    let numberOfRows = Math.floor(largeImageHeight / smallImageSize)
    let numberOfCols = Math.floor(largeImageWidth / smallImageSize)

    /**
     * Loop through each block of the large image and:
     *  1. Compute the average RGB value of that block
     *  2. Find the small image with the lowest color distance to that block
     *  3. Add that small images data to the set of best matches and save the distance
     */
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

    /**
     * Save information about the mozaic
     */
    let matchInfo = {
        averageDistance: myMathHelper.getAverage(distances),
        worstDistance: myMathHelper.getWorstMatchDistance(distances)
    }

    /**
     * Join the images in each row of the mozaic, then join the rows to create the final mozaic
     */
    let rowsOfImages = await compileImageRows(bestMatches, numberOfRows, numberOfCols)
    try {
        let out = await joinImages(rowsOfImages, { 'direction': 'vertical' })
        let buffer = await out.png().toBuffer({resolveWithObject: true})
        return {buffer: buffer, matchInfo: matchInfo}
    } catch(error) {
        console.error(error)
    }
}

/**
 * Find the lowest color distance between the image set and the
 * toMatch hex value
 * 
 * @param toMatch   Hex value to find best match for
 * @param images    Image set to use for best match search
 * @returns         Best match image and the associated distance
 */
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

export { createMozaic }