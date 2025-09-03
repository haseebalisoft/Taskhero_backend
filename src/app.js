// import express from "express"
// import cors from "cors"
// import cookieParser from "cookie-parser"
// import path from "path";
import session from "express-session";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./Customer/routes/auth.routes.js";
import userRoutes from "./Customer/routes/user.routes.js";
import locationRoutes from "./Customer/routes/location.routes.js";
import serviceRoutes from "./Customer/routes/service.routes.js";
// import interestRoutes from './routes/interest.routes.js';
import cartRoutes from './Customer/routes/cart.routes.js';
import orderRoutes from './Customer/routes/order.routes.js';
import paymentRoutes from './Customer/routes/payment.routes.js';
import taskRoutes from './Customer/routes/task.routes.js';
import offerRoutes from './Customer/routes/offer.routes.js';
import chatRoutes from './Customer/routes/chat.routes.js';
import heroRoutes from './Customer/routes/hero.routes.js';
import taskheroRoutes from './Hero/routes/Hhero.routes.js';
import driverRoutes from './Driver/routes/Ddriver.routes.js';
import heroDashboardRoutes from './Hero/routes/dashboard.routes.js';
const app = express()
app.use(cors({
    origin: process.env.CORS_ORIGIN||"http://localhost:3000" ,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())
app.use(session({
    secret: process.env.ACCESS_TOKEN_SECRET || "defaultsecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false, // true only in production with HTTPS
        httpOnly: true,
        sameSite: 'lax'
    }
}));

//routes import

//routes declaration
// app.use('/api/auth', authRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/location", locationRoutes);
app.use("/api", serviceRoutes);
//app.use('/api', interestRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/order', orderRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/task', taskRoutes);
app.use('/api/taskoffer', offerRoutes);
//remaining
app.use('/api/chat', chatRoutes);
app.use('/api/hero', heroRoutes);
app.use('/api/taskhero', taskheroRoutes);
//app.use('/api', reviewRoutes);
app.use('/api/driver', driverRoutes);
app.use('/api', heroDashboardRoutes);



// http://localhost:8000/api/v1/users/register

export { app }