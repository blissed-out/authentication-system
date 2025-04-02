import express from "express"
import route from "./router/user.route.js"
import dotenv from "dotenv"
import cors from "cors"
import db from "./utils/db.js"
import cookieParser from "cookie-parser"

dotenv.config();

const app = express();

db(); // database connection

const port = process.env.PORT || 4000;
app.use(express.json()); // to convert the object to json, so we can read with req.body
app.use(express.urlencoded({ extended: true })); // to convert objects, arrays to string
app.use(cookieParser(process.env.COOKIE_SECRET_KEY));


app.use(cors({
    origin: process.env.BASE_URL,
    httpOnly: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE']
})); // for security purposes

app.use('/api/v1/users/', route);

app.listen(port, () => {
    console.log(`listening on port ${port}`);
})
