async function uploadToS3(e) {
    
    e.preventDefault();

    console.log("In upload")

    var image = $("#myImage").get(0).src
    var mozaicName = $('#mozaicName').val()
    axios.defaults.withCredentials = true
    const result = await axios.post('http://localhost:5000/s3', {
        image: image,
        mozaicName: mozaicName
    })

    console.log(result)
}

export { uploadToS3 }