$('#register-form').on('submit', async (e) => {
    e.preventDefault()

    let username = $('#username').val()
    let password = $('#password').val()
    console.log(`username: ${username} password: ${password}`)
    axios.defaults.withCredentials = true
    const result = await axios.post('http://localhost:5000/authentication/register', {
        username: username,
        password: password
    })

    console.log(result)

    if (result.data.success) {
        window.location.assign('./login.html')
    }
})