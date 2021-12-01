import { uploadToS3 } from './static/js/utils/s3_utils.js'
import { processAndDisplayMozaic, getImageData } from './static/js/utils/image_handling.js'

$(window).on('load', async () => {

    axios.defaults.withCredentials = true
    const result = await axios.get('http://localhost:5000/authentication/')
    if (!result.data.isAuthenticated) {window.location.assign('./static/html/login.html')}
})

$(document).ready(() => {
    const valueSpan = $('#smallImageSizeSpan')
    const value = $('#smallImageSize')
    valueSpan.html(value.val())
    value.on('input change', () => {

        valueSpan.html(value.val());
    });
})

$('#submitButton').click(processAndDisplayMozaic)
$('#analyzeButton').click(getImageData)
$('#saveMozaicForm').on('submit', uploadToS3)