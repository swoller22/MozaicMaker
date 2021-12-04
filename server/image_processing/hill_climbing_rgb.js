import { joinImages } from 'join-images'
import sharp from 'sharp'
import cd from 'color-difference'
import { extractRGBAverage, resizeImages, compileImageRows } from '../utils/image_processing.js'
import { getAverageColor } from 'fast-average-color-node'
import { myMathHelper } from '../utils/math_utils.js'

/**
 * Create mozaic using a special variation of the Hill Climbing algorithm as follows:
 *  1. Sort the input small image set by RGB, RBG, GBR, GRB, BRG, BGR to create 6 "hills"
 *  2. Create 6 hill climbers, starting at the center of each hill
 *  3. Have each hill climber climb based on the color distance found at their neighboring points on the hill
 *  4. Compare the hill climbers color distances, select the minimum as the match for that large image block
 * 
 * Possible future additions:
 *  1. Use random-restart search on all 6 hills with a color-distance heuristic
 *      Pros: Generally better matches
 *      Cons: Possible no match, speed benefits drastically reduced 
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

    let resizedLargeImage = await sharp(largeImageBuffer)
        .resize({ width: largeImageWidth, height: largeImageHeight })
        .toBuffer()

    let resizedImagesToGenerateFrom = await resizeImages(smallImageBuffers, smallImageSize)

    let numberOfRows = Math.floor(largeImageHeight / smallImageSize)
    let numberOfCols = Math.floor(largeImageWidth / smallImageSize)

    /**
     * Create an array of average RGB values from the input image set
     */
    let smallImageRGBs = []
    for (const smallImage of resizedImagesToGenerateFrom) {
        let rgb = await getAverageColor(smallImage.data)
        let newObj = {
            smallImageBuffer: smallImage.data,
            hex: rgb.hex,
            r: rgb.value[0],
            g: rgb.value[1],
            b: rgb.value[2]
        }

        smallImageRGBs.push(newObj)
    }

    /**
     * Next, sort the images 6 ways:
     * RGB
     * RBG
     * GBR
     * GRB
     * BGR
     * BRG
    */
    let rgbSorted = [...smallImageRGBs]
    let rbgSorted = [...smallImageRGBs]
    let gbrSorted = [...smallImageRGBs]
    let grbSorted = [...smallImageRGBs]
    let brgSorted = [...smallImageRGBs]
    let bgrSorted = [...smallImageRGBs]
    rgbSorted.sort((a, b) => (a.r - b.r) || (a.g - b.g) || (a.b - b.b))
    rbgSorted.sort((a, b) => (a.r - b.r) || (a.b - b.b) || (a.g - b.g))
    gbrSorted.sort((a, b) => (a.g - b.g) || (a.b - b.b) || (a.r - b.r))
    grbSorted.sort((a, b) => (a.g - b.g) || (a.r - b.r) || (a.b - b.b))
    brgSorted.sort((a, b) => (a.b - b.b) || (a.r - b.r) || (a.g - b.g))
    bgrSorted.sort((a, b) => (a.b - b.b) || (a.g - b.g) || (a.r - b.r))

    let arrayOfSortedArrays = [
        rgbSorted,
        rbgSorted,
        gbrSorted,
        grbSorted,
        brgSorted,
        bgrSorted
    ]

    /**
     * Loop through each block of the large image and:
     *  1. Compute the average RGB value of that block
     *  2. Find the hill climber that had the best match to that block
     *  3. Add that small images data to the set of best matches and save the distance
     */
    var distances = []
    var bestMatches = []
    for (let row = 0; row < numberOfRows; row++) {
        for (let col = 0; col < numberOfCols; col++) {
            let blockAverage = await extractRGBAverage(resizedLargeImage, col * smallImageSize, row * smallImageSize, smallImageSize)
            let bestMatch = findBestMatchOfAll(blockAverage, arrayOfSortedArrays, climbDistance)
            distances.push(bestMatch.closestDistance)
            console.log(`${row},${col} match found`)
            bestMatches.push(bestMatch.data[bestMatch.indexOfBest].smallImageBuffer)
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
    } catch (error) {
        console.error(error)
    }
}

/**
 * Find the best match over all hill climbers by:
 *  1. Have each hill climber find their best match
 *  2. Track which hill climber has the minimum best match as the winner
 * 
 * @param   blockAverage            Block average HEX value
 * @param   arrayOfSortedArrays     Array of hills to climb
 * @param   climbDistance           Maximum distance any climber can go
 * @returns                         Hill climber with the best match
 */
function findBestMatchOfAll(blockAverage, arrayOfSortedArrays, climbDistance) {

    let bestHillClimberDistance = 101
    let bestHillClimber = null
    for (const sortedArray of arrayOfSortedArrays) {
        
        let hillClimber = findBestMatch(blockAverage, sortedArray, climbDistance)
        if ( hillClimber.closestDistance < bestHillClimberDistance ) {

            bestHillClimber = hillClimber
            bestHillClimberDistance = hillClimber.closestDistance
        }
    }

    return bestHillClimber
}

/**
 * Using the hill climbing algorithm, find the best match starting at the center point
 * of the hill
 * 
 * @param  blockAverage                      HEX value to match against 
 * @param  resizedImagesToGenerateFromRGBs   Array of RGB value hills to climb
 * @param  climbDistance                     Maximum distance to climb
 * @returns                                     The hill climber
 */
function findBestMatch(blockAverage, resizedImagesToGenerateFromRGBs, climbDistance) {

    /**
     * We start the hill climber at the center of the hill
     */
    let startIndex = Math.floor(resizedImagesToGenerateFromRGBs.length/2)

    /**
     * Helper function for generating our hill climber
     * 
     * @param   sortedData  The hill  
     * @param   startIndex  Starting index on the hill
     * @returns             Hill climber object  
     */ 
    function generateHillClimber(sortedData, startIndex) {

        let distance = cd.compare(blockAverage.hex, sortedData[startIndex].hex)
        return {
            data: sortedData,
            indexOfBest: startIndex,
            closestDistance: distance
        }
    }

    let hillClimber = generateHillClimber(resizedImagesToGenerateFromRGBs, startIndex)

    /**
     * Unoptimized loop that will climb a maximum of climbDistance to a local minimum
     */
    for (var i = 0; i < climbDistance; i++) {

        var rightDistance = 101
        var leftDistance = 101

        if (hillClimber.indexOfBest < (hillClimber.data.length - 1)) {
            var rightDistance = cd.compare(blockAverage.hex, hillClimber.data[hillClimber.indexOfBest + 1].hex)
        }

        if ((hillClimber.indexOfBest) > 0) {
            var leftDistance = cd.compare(blockAverage.hex, hillClimber.data[hillClimber.indexOfBest - 1].hex)
        }

        // If the point to the right is a better match, climb right
        if ((rightDistance <= hillClimber.closestDistance) && (rightDistance < leftDistance)) {
            hillClimber.indexOfBest = hillClimber.indexOfBest + 1
            hillClimber.closestDistance = rightDistance
            console.log(`Climbing right for a distance of ${hillClimber.closestDistance} with image ${hillClimber.data[hillClimber.indexOfBest].hex}`)
        }
        // If the point to the left is a better match, climb left
        if (leftDistance <= hillClimber.closestDistance) {
            hillClimber.indexOfBest = hillClimber.indexOfBest - 1
            hillClimber.closestDistance = leftDistance
            console.log(`Climbing left for a distance of ${hillClimber.closestDistance} with image ${hillClimber.data[hillClimber.indexOfBest].hex}`)
        }
    }

    return hillClimber
}

export { createMozaic }