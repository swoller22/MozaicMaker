import sharp from 'sharp'
import { extractRGBAverage, resizeImages } from '../utils/image_processing.js'
import { getAverageColor } from 'fast-average-color-node'

async function getImageData(largeImageBuffer, smallImageBuffers, configs) {

    let largeImageWidth = configs.largeImageWidth
    let largeImageHeight = configs.largeImageHeight
    let smallImageSize = configs.smallImageSize

    let resizedLargeImage = await sharp(largeImageBuffer)
        .resize({ width: largeImageWidth, height: largeImageHeight })
        .toBuffer()

    let resizedImagesToGenerateFrom = await resizeImages(smallImageBuffers, smallImageSize)

    let numberOfRows = Math.floor(largeImageHeight / smallImageSize)
    let numberOfCols = Math.floor(largeImageWidth / smallImageSize)

    // Get block averages from large image
    var blockAveragesR = []
    var blockAveragesG = []
    var blockAveragesB = []
    for (let row = 0; row < numberOfRows; row++) {
        for (let col = 0; col < numberOfCols; col++) {
            
            let blockAverage = await extractRGBAverage(resizedLargeImage, col * smallImageSize, row * smallImageSize, smallImageSize)
            blockAveragesR.push(blockAverage.value[0])
            blockAveragesG.push(blockAverage.value[1])
            blockAveragesB.push(blockAverage.value[2])
        }
    }

    var smallImageAveragesR = []
    var smallImageAveragesG = []
    var smallImageAveragesB = []
    for (const image of resizedImagesToGenerateFrom) {

        const color = await getAverageColor(image.data);
        smallImageAveragesR.push(color.value[0])
        smallImageAveragesG.push(color.value[1])
        smallImageAveragesB.push(color.value[2])
    }

    let blockAverages = {
        R: blockAveragesR,
        G: blockAveragesG,
        B: blockAveragesB
    }

    let smallImageAverages = {
        R: smallImageAveragesR,
        G: smallImageAveragesG,
        B: smallImageAveragesB
    }

    try {
        return {blockAverages: blockAverages, smallImageAverages: smallImageAverages}
    } catch(error) {
        console.error(error)
    }
}

export { getImageData }