import { joinImages } from 'join-images'
import sharp from 'sharp'
import cd from 'color-difference'
import { extractRGBAverage, resizeImages, compileImageRows } from '../utils/image_processing.js'
import { getAverageColor } from 'fast-average-color-node'
import colorSort from 'color-sorter'
import { myMathHelper } from '../utils/math_utils.js'

/**
 * Create mozaic using a special variation of the Hill Climbing algorithm as follows:
 *  1. Sort the input small image set by Hue, Saturation, then Value (HSV)
 *  2. Create configs.numberOfClimbers hill climbers, evenly spaced across the HSV hill
 *  3. Have each climber find their local minimum and select the climber that found the absolute minimum
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
    let climbDistance = configs.climbDistance
    let numberOfClimbers = configs.numberOfClimbers

    let resizedLargeImage = await sharp(largeImageBuffer)
        .resize({ width: largeImageWidth, height: largeImageHeight })
        .toBuffer()

    let resizedImagesToGenerateFrom = await resizeImages(smallImageBuffers, smallImageSize)

    let numberOfRows = Math.floor(largeImageHeight / smallImageSize)
    let numberOfCols = Math.floor(largeImageWidth / smallImageSize)

    /**
     * Create two arrays of average RGB values, sorted and unsorted (unsorted is necessary to retrieve the image data once the
     * index of the minimum is found)
     */
    let smallImageHexs = []
    let smallImageHexsUnsorted = []
    for (const smallImage of resizedImagesToGenerateFrom) {
        let rgb = await getAverageColor(smallImage.data)
        smallImageHexs.push(rgb.hex)
        smallImageHexsUnsorted.push(rgb.hex)
    }

    // Sort the images by HSV
    smallImageHexs.sort(colorSort.sortFn)

    /**
     * Loop through each block of the large image and:
     *  1. Compute the average RGB value of that block
     *  2. Find the hill climber that had the best match to that block
     *  3. Add that small images data to the set of best matches and save the distance
     */
    var bestMatches = []
    var distances = []
    for (let row = 0; row < numberOfRows; row++) {
        for (let col = 0; col < numberOfCols; col++) {
            let blockAverage = await extractRGBAverage(resizedLargeImage, col * smallImageSize, row * smallImageSize, smallImageSize)
            let bestMatch = findBestMatch(blockAverage, smallImageHexs, climbDistance, numberOfClimbers)
            distances.push(bestMatch.closestDistance)
            console.log(`${row},${col} match found match with distance ${bestMatch.closestDistance} with:
             name: ${bestMatch.name}
             hex: ${bestMatch.data[bestMatch.indexOfBest]}
             index: ${smallImageHexsUnsorted.indexOf(bestMatch.data[bestMatch.indexOfBest])}`)
            bestMatches.push(resizedImagesToGenerateFrom[smallImageHexsUnsorted.indexOf(bestMatch.data[bestMatch.indexOfBest])].data)
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
        let buffer = await out.png().toBuffer({ resolveWithObject: true })
        return { buffer: buffer, matchInfo: matchInfo }
    } catch (error) {
        console.error(error)
    }

}

/**
 * Find the best match using numberOfClimbers the smallImageHexs hill, using minimum color-distance
 * to the blockAverage as the search heuristic
 * 
 * @param blockAverage      Block average HEX value
 * @param smallImageHexs    HEX set to use for best match search
 * @param climbDistance     Maximum distance a climber can climb
 * @param numberOfClimbers  Number of distributed climbers
 * @returns                 Best hill climber
 */
function findBestMatch(blockAverage, smallImageHexs, climbDistance, numberOfClimbers) {

    // Evenly spread the start indeces of each hill climber
    let startIndeces = []
    for (let i = 0; i < numberOfClimbers; i++) {

        startIndeces.push(Math.floor(i * (smallImageHexs.length - 1) / (numberOfClimbers - 1)))
    }

    /**
     * Helper function to generate the hill climbers
     * 
     * @param name          Name of the climber
     * @param sortedData    Hill to climb
     * @param startIndex    Starting index
     * @param climbDistance Maximum climb distance
     * @returns                 Hill climber object
     */
    let generateHillClimber = function (name, sortedData, startIndex, climbDistance) {

        let distance = cd.compare(blockAverage.hex, sortedData[startIndex])
        return {
            name: name,
            data: sortedData,
            indexOfBest: startIndex,
            closestDistance: distance,
            climb: function () {
                for (var i = 0; i < climbDistance; i++) {

                    var rightDistance = 101
                    var leftDistance = 101

                    if (this.indexOfBest < (this.data.length - 1)) {
                        var rightDistance = cd.compare(blockAverage.hex, this.data[this.indexOfBest + 1])
                    }

                    if (this.indexOfBest > 0) {
                        var leftDistance = cd.compare(blockAverage.hex, this.data[this.indexOfBest - 1])
                    }

                    if ((rightDistance <= this.closestDistance) && (rightDistance < leftDistance)) {
                        this.indexOfBest = this.indexOfBest + 1
                        this.closestDistance = rightDistance
                        //console.log(`Climbing right for a distance of ${this.closestDistance} with image ${this.data[this.indexOfBest]}`)
                    }

                    if (leftDistance <= this.closestDistance) {
                        this.indexOfBest = this.indexOfBest - 1
                        this.closestDistance = leftDistance
                        //console.log(`Climbing left for a distance of ${this.closestDistance} with image ${this.data[this.indexOfBest]}`)
                    }
                }
            }
        }
    }

    /**
     * Generate hill climbers
     */
    let hillClimbers = []
    for (let i = 0; i < numberOfClimbers; i++) {
        hillClimbers.push(generateHillClimber(`Climber ${i}`, smallImageHexs, startIndeces[i], climbDistance))
    }

    /**
     * Have each climber climb
     */
    hillClimbers.forEach(hillClimber => {
        //console.log(`Hill ${hillClimber.name} is climbing from index ${hillClimber.indexOfBest}`)
        hillClimber.climb()
    });

    /**
     * Find the best climber
     */
    let bestHillClimber = null
    let bestDistance = 101
    for (const hillClimber of hillClimbers) {
        if (hillClimber.closestDistance <= bestDistance) {

            bestHillClimber = hillClimber
            bestDistance = hillClimber.closestDistance
        }
    }

    return bestHillClimber
}

export { createMozaic }