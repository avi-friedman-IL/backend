import http from 'http'
import path from 'path'
import cors from 'cors'
import express from 'express'
import cookieParser from 'cookie-parser'
import session from 'express-session'
import passport from 'passport'
import dotenv from 'dotenv'
dotenv.config()
import MongoStore from 'connect-mongo';

import { Strategy as GoogleStrategy } from 'passport-google-oauth20'

import { authRoutes } from './api/auth/auth.routes.js'
import { userRoutes } from './api/user/user.routes.js'
import { reviewRoutes } from './api/review/review.routes.js'
import { boardRoutes } from './api/board/board.routes.js'
import { setupSocketAPI } from './services/socket.service.js'

import { setupAsyncLocalStorage } from './middlewares/setupAls.middleware.js'
const app = express()
const server = http.createServer(app)

// Express App Config
app.use(cookieParser())
app.use(express.json())

app.use(
    session({
        secret: 'some secret',
        resave: false,
        saveUninitialized: true,
    })
)

app.use(passport.initialize())
app.use(passport.session())


// הגדרת session middleware עם MongoStore
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET, // מחרוזת סודית להצפנה
//     resave: false, // לא לשמור סשן אם לא נעשה שינוי
//     saveUninitialized: false, // לא לשמור סשנים ריקים
//     store: MongoStore.create({
//       mongoUrl: process.env.MONGO_CONNECTION, // חיבור למסד נתונים של MongoDB
//       ttl: 14 * 24 * 60 * 60, // זמן חיי הסשן (14 ימים לדוגמה)
//       autoRemove: 'native', // מאפשר לנקות סשנים שפגו תוקף בצורה אוטומטית
//     }),
//     cookie: {
//       secure: process.env.NODE_ENV === 'production', // אם ב-Production, נשתמש בקוקי מאובטח
//       maxAge: 1000 * 60 * 60 * 24 * 14, // משך חיי הקוקי (14 ימים)
//     },
//   })
// );


// passport.use(
//     new GoogleStrategy(
//         {
//             clientID: process.env.GOOGLE_CLIENT_ID,
//             clientSecret: process.env.GOOGLE_CLIENT_SECRET,
//             callbackURL: 'http://localhost:5173/auth/google/callback',
//         },
//         (accessToken, refreshToken, profile, done) => {
//             return done(null, profile)
//         }
//     )
// )

// passport.serializeUser((user, done) => {
//     done(null, user)
// })

// passport.deserializeUser((user, done) => {
//     done(null, user)
// })

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('public')))
} else {
    const corsOptions = {
        origin: [
            'http://127.0.0.1:3000',
            'http://localhost:3000',
            'http://127.0.0.1:3030',
            'http://localhost:3030',
            'http://127.0.0.1:5173',
            'http://localhost:5173',
            'http://127.0.0.1:5174',
            'http://localhost:5174',
        ],
        credentials: true,
    }
    app.use(cors(corsOptions))
}
app.all('*', setupAsyncLocalStorage)

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/review', reviewRoutes)
app.use('/api/board', boardRoutes)

setupSocketAPI(server)

// Make every unhandled server-side-route match index.html
// so when requesting http://localhost:3030/unhandled-route...
// it will still serve the index.html file
// and allow vue/react-router to take it from there

app.get('/**', (req, res) => {
    res.sendFile(path.resolve('public/index.html'))
})

import { logger } from './services/logger.service.js'
const port = process.env.PORT || 3030

server.listen(port, () => {
    logger.info('Server is running on port: ' + port)
})
