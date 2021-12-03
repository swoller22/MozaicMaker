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
    $("#hillClimberOptions").hide()
    $("#hsvOptions").hide()
})

/**
 * Dynamic configuration form data
 */
$("input[type=radio][name='btnradio']").change(function() {
    if (this.value == "rgb") {
        $("#hillClimberOptions").show(500)
        $("#hsvOptions").hide(500)
    } else if (this.value == "hsv") {
        $("#hillClimberOptions").show(500)
        $("#hsvOptions").show(500)
    } else if (this.value == "brute") {
        $("#hillClimberOptions").hide(100)
    }
})

// Use external functions for server-dependent features
$('#submitButton').click(processAndDisplayMozaic)
$('#analyzeButton').click(getImageData)
$('#saveMozaicForm').on('submit', uploadToS3)