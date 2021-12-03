import { joinImages } from 'join-images'
import sharp from 'sharp'
import cd from 'color-difference'
import { extractRGBAverage, resizeImages, compileImageRows } from '../utils/image_processing.js'
import { getAverageColor } from 'fast-average-color-node'
import { myMathHelper } from '../utils/math_utils.js'

async function findBestMatchesByHillClimbing(largeImageBuffer, smallImageBuffers, configs) {

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

    //First, create an object to store the Buffer along with it's RGB value
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
     * Second, sort the images 6 ways:
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
    } catch (error) {
        console.error(error)
    }
}

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

    //return bestHillClimber.data[bestHillClimber.indexOfBest]
    return bestHillClimber
}

function findBestMatch(blockAverage, resizedImagesToGenerateFromRGBs, climbDistance) {

    /**
     * Third, set 6 seeds, one in each of the sorted arrays at their midpoints(?), and hill climb
     * 10(?) times to find a good match
     */
    let startIndex = Math.floor(resizedImagesToGenerateFromRGBs.length/2)

    function generateHillClimber(sortedData, startIndex) {

        let distance = cd.compare(blockAverage.hex, sortedData[startIndex].hex)
        return {
            data: sortedData,
            indexOfBest: startIndex,
            closestDistance: distance
        }
    }

    let hillClimber = generateHillClimber(resizedImagesToGenerateFromRGBs, startIndex)

    for (var i = 0; i < climbDistance; i++) {

        var rightDistance = 101
        var leftDistance = 101

        if (hillClimber.indexOfBest < (hillClimber.data.length - 1)) {
            var rightDistance = cd.compare(blockAverage.hex, hillClimber.data[hillClimber.indexOfBest + 1].hex)
        }

        if ((hillClimber.indexOfBest) > 0) {
            var leftDistance = cd.compare(blockAverage.hex, hillClimber.data[hillClimber.indexOfBest - 1].hex)
        }

        if ((rightDistance <= hillClimber.closestDistance) && (rightDistance < leftDistance)) {
            hillClimber.indexOfBest = hillClimber.indexOfBest + 1
            hillClimber.closestDistance = rightDistance
            console.log(`Climbing right for a distance of ${hillClimber.closestDistance} with image ${hillClimber.data[hillClimber.indexOfBest].hex}`)
        }
        if (leftDistance <= hillClimber.closestDistance) {
            hillClimber.indexOfBest = hillClimber.indexOfBest - 1
            hillClimber.closestDistance = leftDistance
            console.log(`Climbing left for a distance of ${hillClimber.closestDistance} with image ${hillClimber.data[hillClimber.indexOfBest].hex}`)
        }
    }

    return hillClimber
}

export { findBestMatchesByHillClimbing }