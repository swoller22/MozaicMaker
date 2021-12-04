import sharp from 'sharp'
import { extractRGBAverage, resizeImages } from '../utils/image_processing.js'
import { getAverageColor } from 'fast-average-color-node'
import colorSort from 'color-sorter'

/**
 * Gather the necessary information to perform analysis on the input selection:
 *  1. Small image RGB average set
 *  2. Block average RGB set
 *  3. Small image RGB average set sorted by HSV
 *  4. Small image RGB average set sorted by RGB, RBG, GRB, GBR, BRG, BGR
 * 
 * @param {*} largeImageBuffer  Large image buffer
 * @param {*} smallImageBuffers Small image buffers
 * @param {*} configs           Configurations
 * @returns                     Block average set, small image average set, and sorted data
 */
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

    //Create HSV sorted
    let smallImageHexs = []
    for (const smallImage of resizedImagesToGenerateFrom) {
        let rgb = await getAverageColor(smallImage.data)
        smallImageHexs.push(rgb.hex)
    }
    smallImageHexs.sort(colorSort.sortFn)

    let smallImageRGBs = []
    for (const smallImage of resizedImagesToGenerateFrom) {
        let rgb = await getAverageColor(smallImage.data)
        let newObj = {
            hex: rgb.hex,
            r: rgb.value[0],
            g: rgb.value[1],
            b: rgb.value[2]
        }

        smallImageRGBs.push(newObj)
    }
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

    let rgbSortedHex = []
    for (const smallImage of rgbSorted) {
        rgbSortedHex.push(smallImage.hex)
    }

    let rbgSortedHex = []
    for (const smallImage of rbgSorted) {
        rbgSortedHex.push(smallImage.hex)
    }

    let gbrSortedHex = []
    for (const smallImage of gbrSorted) {
        gbrSortedHex.push(smallImage.hex)
    }

    let grbSortedHex = []
    for (const smallImage of grbSorted) {
        grbSortedHex.push(smallImage.hex)
    }

    let brgSortedHex = []
    for (const smallImage of brgSorted) {
        brgSortedHex.push(smallImage.hex)
    }

    let bgrSortedHex = []
    for (const smallImage of bgrSorted) {
        bgrSortedHex.push(smallImage.hex)
    }

    let sortedData = {
        hsvSorted: smallImageHexs,
        rgbSorted: rgbSortedHex,
        rbgSorted: rbgSortedHex,
        gbrSorted: gbrSortedHex,
        grbSorted: grbSortedHex,
        brgSorted: brgSortedHex,
        bgrSorted: bgrSortedHex
    }

    try {
        return { blockAverages: blockAverages, smallImageAverages: smallImageAverages, sortedData: sortedData }
    } catch (error) {
        console.error(error)
    }
}

export { getImageData }