import sharp from 'sharp'
import { getAverageColor } from 'fast-average-color-node'
import { joinImages } from 'join-images'

async function extractRGBAverage(buffer, leftStart, topStart, squareSize) {

    const extracted = await sharp(buffer)
        .extract({ left: leftStart, top: topStart, width: squareSize, height: squareSize })
        .toBuffer()

    return getAverageColor(extracted)
}

async function resizeImages(imageBuffers, squareSize) {

    console.log("Resizing images...")
    let resizedImages = []
    for (const imageBuffer of imageBuffers) {
        
        const resizedImage = await sharp(imageBuffer)
            .resize({ width: squareSize, height: squareSize })
            .toBuffer()
        resizedImages.push({
            data: resizedImage
        })        
    }
    
    return resizedImages;
}

async function compileImageRows(images, numberOfRows, numberOfCols) {
    let rowsOfImages = []

    for (let row = 0; row < numberOfRows; row++) {

        let thisRow = images.slice(row * numberOfCols, row * numberOfCols + numberOfCols)
        let out = await joinImages(thisRow, { 'direction': 'horizontal' })
        let outBuffer = await out.toFormat('png').toBuffer()
        rowsOfImages.push(outBuffer)
    }

    return rowsOfImages
}

export {extractRGBAverage, resizeImages, compileImageRows}