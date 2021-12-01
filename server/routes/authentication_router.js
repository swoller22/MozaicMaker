import express from 'express'
import passport from 'passport'

import { AccountModel } from '../models/accounts.js'

const authentication_router = express.Router()

// passport config
passport.use(AccountModel.createStrategy())
passport.serializeUser(AccountModel.serializeUser())
passport.deserializeUser(AccountModel.deserializeUser())

authentication_router.route('/')
    .all((req, res, next) => {
        console.log("Accessing authentication route...")
        next()
    })
    .get((req, res) => {

        if(req.isAuthenticated()) {res.send({ isAuthenticated: true })}
        else {res.send({isAuthenticated: false})}
    })

authentication_router.route('/register')
    .all((req, res, next) => {
        console.log("Accessing register route...")
        next()
    })
    .post((req, res) => {

        AccountModel.register(new AccountModel({ username: req.body.username }), req.body.password, function (err, account) {
            if (err) {

                return res.send("Error, cannot register")
            }
            res.send({ success: true })
        })
    })

authentication_router.route('/login')
    .all((req, res, next) => {
        console.log("Accessing login route...")
        next()
    })
    .post((req, res) => {

        console.log("Attempting login")
        passport.authenticate('local', function (err, user, info) {
            console.log(user)
            req.login(user, function(err) {
                console.log(req.user)
                res.json({success:true})
            })
        })(req, res)
    })

export { authentication_router }