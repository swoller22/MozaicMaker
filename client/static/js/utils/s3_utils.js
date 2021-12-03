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

    if(result.data.success == false) {
        $('#saveMozaicForm .alert').show(500)
    } else {
        $('#saveMozaicForm .alert').hide(500)
    }

    console.log(result.data)
}

export { uploadToS3 }