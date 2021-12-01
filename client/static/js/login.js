$('#login-form').on('submit', async (e) => {
    e.preventDefault()
    console.log("In login form submit")

    let username = $('#username').val()
    let password = $('#password').val()
    console.log(`username: ${username} password: ${password}`)
    axios.defaults.withCredentials = true
    const result = await axios.post('http://localhost:5000/authentication/login', {
        username: username,
        password: password
    })

    console.log(result)

    if (result.data.success) {
        window.location.assign('../../index.html')
    }
})