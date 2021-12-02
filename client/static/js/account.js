$(window).on('load', async () => {

    axios.defaults.withCredentials = true
    const result = await axios.get('http://localhost:5000/authentication/')
    if (!result.data.isAuthenticated) {window.location.assign('../html/login.html')} 
})

$('#deleteAccount').click(async() => {

    axios.defaults.withCredentials = true
    const result = await axios.delete('http://localhost:5000/authentication')
    console.log(result)
    window.location.assign('../html/login.html') 
})
