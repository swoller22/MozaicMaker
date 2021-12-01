$(window).on('load', async () => {

    axios.defaults.withCredentials = true
    const result = await axios.get('http://localhost:5000/authentication/')
    if (!result.data.isAuthenticated) {window.location.assign('../html/login.html')} 

    // If you passed authentication, populate the gallery
    const images = await axios.get(`http://localhost:5000/s3/`)
    for (const image of images.data) {
        var b64encoded = btoa(image.Body.data.reduce(function(a,b) { return a+String.fromCharCode(b) }, '')).replace(/.{76}(?=.)/g,'$&\n')
        var img = document.createElement('img')
        img.src = 'data:image/jpg;base64,' + b64encoded.toString('base64')
        $("#gallery").get(0).insertAdjacentHTML('afterbegin', 
            `<div class='col-4 item'>
                <a href='${img.src}' data-lightbox='photos'>
                    <img class='img-fluid' src='${img.src}'>
                </a>
            </div>`)
    }
})

$('#deleteGallery').click(async() => {

    axios.defaults.withCredentials = true
    const result = await axios.delete('http://localhost:5000/s3')
})
