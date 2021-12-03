$(document).ready(() => {

    $(".alert").hide()
})

$('#login-form').on('submit', async (e) => {
    e.preventDefault()

    let username = $('#username').val()
    let password = $('#password').val()

    axios.defaults.withCredentials = true
    const result = await axios.post('http://localhost:5000/authentication/login', {
        username: username,
        password: password
    })

    console.log(result.data)

    if (result.data.success) {
        window.location.assign('../../index.html')
    } else {
        $(".alert").show(500)
    }
})