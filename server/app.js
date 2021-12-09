import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import expressSession from 'express-session'
import passport from 'passport'
import mongoose from 'mongoose'

import { readFile } from 'fs/promises';

import { image_processing_router } from './routes/image_processing_router.js'
import { s3_router } from './routes/s3_router.js'
import { authentication_router } from './routes/authentication_router.js'


const app = express()
app.use(expressSession({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
}));
const corsOptions = {
    origin: true,
    credentials: true,
    optionSuccessStatus: 200
}
app.use(cors(corsOptions))
app.use(cookieParser('keyboard cat'))

app.use(express.json({limit: '50mb'}))
app.use(passport.initialize())
app.use(passport.session())
app.use(express.urlencoded({limit: "50mb", extended: true, parameterLimit:50000}))

app.use('/image_processing', image_processing_router)
app.use('/s3', s3_router)
app.use('/authentication', authentication_router)

app.listen(process.env.PORT, () => console.log(`listening on port ${process.env.PORT}`))

// Open Mongo connection. Note: using process.env instead of mongo_config due to security concerns with github
mongoose.connect(`${process.env.MONGODB_URI}`)