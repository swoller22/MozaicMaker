import { joinImages } from 'join-images'
import sharp from 'sharp'
import cd from 'color-difference'
import { extractRGBAverage, resizeImages, compileImageRows } from '../utils/image_processing.js'
import { getAverageColor } from 'fast-average-color-node'
import colorSort from 'color-sorter'
import { myMathHelper } from '../utils/math_utils.js'

async function findBestMatchesByHillClimbing(largeImageBuffer, smallImageBuffers, configs) {

    let largeImageWidth = configs.largeImageWidth
    let largeImageHeight = configs.largeImageHeight
    let smallImageSize = configs.smallImageSize

    let resizedLargeImage = await sharp(largeImageBuffer)
        .resize({ width: largeImageWidth, height: largeImageHeight })
        .toBuffer()

    let resizedImagesToGenerateFrom = await resizeImages(smallImageBuffers, smallImageSize)

    let numberOfRows = Math.floor(largeImageHeight / smallImageSize)
    let numberOfCols = Math.floor(largeImageWidth / smallImageSize)

    //First, create an object to store the Buffer along with it's RGB value
    let smallImageHexs = []
    let smallImageHexsUnsorted = []
    let imageDataForDisplay = []
    for (const smallImage of resizedImagesToGenerateFrom) {
        let rgb = await getAverageColor(smallImage.data)
        imageDataForDisplay.push(smallImage.data)
        smallImageHexs.push(rgb.hex)
        smallImageHexsUnsorted.push(rgb.hex)
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
    smallImageHexs.sort(colorSort.sortFn)
/*
    for (const hex of smallImageHexs) {
        imageDataForDisplay.push(resizedImagesToGenerateFrom[smallImageHexsUnsorted.indexOf(hex)].data)
    }

    console.log(imageDataForDisplay)

    let rowsOfImages = await compileImageRows(imageDataForDisplay, 2, imageDataForDisplay.length/2)
    let out = await joinImages(rowsOfImages, { 'direction': 'vertical' })
    return out.png().toBuffer({ resolveWithObject: true })
*/
    
    //console.log(smallImageHexsUnsorted)

    var bestMatches = []
    var distances = []
    for (let row = 0; row < numberOfRows; row++) {
        for (let col = 0; col < numberOfCols; col++) {
            let blockAverage = await extractRGBAverage(resizedLargeImage, col * smallImageSize, row * smallImageSize, smallImageSize)
            let bestMatch = findBestMatch(blockAverage, smallImageHexs)
            distances.push(bestMatch.closestDistance)
            console.log(`${row},${col} match found match with distance ${bestMatch.closestDistance} with:
             name: ${bestMatch.name}
             hex: ${bestMatch.data[bestMatch.indexOfBest]}
             index: ${smallImageHexsUnsorted.indexOf(bestMatch.data[bestMatch.indexOfBest])}`)
            bestMatches.push(resizedImagesToGenerateFrom[smallImageHexsUnsorted.indexOf(bestMatch.data[bestMatch.indexOfBest])].data)
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

function findBestMatch(blockAverage, smallImageHexs) {

    /**
     * Third, set 6 seeds, one in each of the sorted arrays at their midpoints(?), and hill climb
     * 10(?) times to find a good match
     */
    let startIndex0 = 0
    let startIndex1 = Math.floor(smallImageHexs.length/5)
    let startIndex2 = Math.floor(2*smallImageHexs.length/5)
    let startIndex3 = Math.floor(3*smallImageHexs.length/5)
    let startIndex4 = Math.floor(4*smallImageHexs.length/5)
    let startIndex5 = smallImageHexs.length - 1

    function generateHillClimber(name, sortedData, startIndex) {

        let distance = cd.compare(blockAverage.hex, sortedData[startIndex])
        return {
            name: name,
            data: sortedData,
            indexOfBest: startIndex,
            closestDistance: distance,
            climb: function() {
                for (var i = 0; i < 10; i++) {

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

    let hillClimber0 = generateHillClimber('Climber 1', smallImageHexs, startIndex0)
    let hillClimber1 = generateHillClimber('Climber 2', smallImageHexs, startIndex1)
    let hillClimber2 = generateHillClimber('Climber 3', smallImageHexs, startIndex2)
    let hillClimber3 = generateHillClimber('Climber 4', smallImageHexs, startIndex3)
    let hillClimber4 = generateHillClimber('Climber 5', smallImageHexs, startIndex4)
    let hillClimber5 = generateHillClimber('Climber 6', smallImageHexs, startIndex5)


    hillClimber0.climb()
    hillClimber1.climb()
    hillClimber2.climb()
    hillClimber3.climb()

    let hillClimbers = [hillClimber0, hillClimber1, hillClimber2, hillClimber3, hillClimber4, hillClimber5]

    let bestHillClimber = null
    let bestDistance = 101
    for (const hillClimber of hillClimbers) {
        if ( hillClimber.closestDistance <= bestDistance ) {

            bestHillClimber = hillClimber
            bestDistance = hillClimber.closestDistance
        }
    }
    
    return bestHillClimber
}

export { findBestMatchesByHillClimbing }