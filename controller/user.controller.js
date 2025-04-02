import User from '../model/User.model.js'
import crypto from 'crypto'
import sendMail from '../utils/nodemailer.js';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

// const home = (req, res) => {
//     res.send("This is home page");
// }

const register = async (req, res) => {
    // get data
    // validate the data
    // store the data in database
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(401).json({
            message: "All fields are required",
            success: false
        })
    }

    // check if user already exists in the database
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(401).json({
                message: "User already registered",
                success: false
            })
        }
    } catch (error) {
        console.log("findone failed", error);
        return res.status(500).json({
            message: "Error occured",
            success: false
        })
    }
    // register user to the database
    try {
        const user = new User({ name, email, password });

        // save verification token to db
        const generatedToken = crypto.randomBytes(32).toString("hex");
        user.verificationToken = generatedToken;

        // saving data on database
        await user.save();

        // send verification token to user using nodemailer
        sendMail("sandbox.smtp.mailtrap.io", "2271db6d4c05ab", "f1eee1877b918e", "aadarshCompany", user.email, "verify your email", `click the link below to verify your email ${process.env.BASE_URL}/api/v1/users/verify/${generatedToken}`);

        res.status(200).json({
            message: "User registered successfully",
            success: true
        })
    } catch (error) {
        console.error("Registering failed", error);
        return res.status(500).json({
            message: "Error occured",
            success: false
        })
    }
}

const verifyUser = async (req, res) => {
    // get token from url
    // validate
    // find user based on token
    // if not found return user not found
    // set isVerified to true
    // remove verification token from database
    // save database
    // return response
    const tokenFromUrl = req.params['token'] // get token from url
    try {
        const user = await User.findOne({ verificationToken: tokenFromUrl }); // find the user based on token
        if (!user) return res.status(401).json({ message: "User not found", success: false }); // if not found
        user.isVerified = true; // if user is found, verificatoin success
        user.verificationToken = undefined; // no need of verifitcationToken in database
        await user.save();
        res.status(200).json({
            message: "Verification successful",
            success: true,
        })
    } catch (error) {
        console.error("could not run findOne in verify controller", error);
    }
}

const login = async (req, res) => {
    // get email and password from user
    // validate
    // if not found return failure response
    // if found, send jsonweb token as cookies
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({
                message: "User not registered",
                success: false
            })
        }

        // if email exists, check the password
        const isPasswordCorrect = bcrypt.compare(password, user.password)
        if (!isPasswordCorrect) {
            return res.status(400).json({
                message: "Invalid password",
                success: false
            })
        }


        // if login successful, send jsonweb token to user
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
        const cookiesOptions = {
            // expires: Date.now() + 24 * 60 * 60 * 1000,
            maxAge: 1 * 60 * 60 * 1000, // max 1 hour session maintained for security purposes
            httpOnly: true,
            // signed: true,
        };
        res.cookie("token", token, cookiesOptions);
        req.expiryTime = Date.now() + 60 * 60 //* 60; // adding 1 hour in miliseconds
        res.status(200).json({
            message: "Login successful",
            success: true,
            // token: token,
            token,
            user: {
                id: user._id,
                name: user.name,
            }
        });
    } catch (error) {
        console.error("error in login controller", error);
    }
}

const getMe = async (req, res) => {
    // get token
    // validate token
    // get access to /me route
    if (!req.user) {
        return res.status(400).json({
            success: false,
            message: "No session token"
        })
    }
    const user = await User.findById(req.user.id);
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "session expired"
        });
    }
    // check expiry of the token
    if (req.expiryTime <= Date.now()) {
        return res.status(401).json({
            success: false,
            message: "session expired"
        })
    }

    res.status(200).json({
        success: true,
        user_info: req.user,
        expiryTime: req.expiryTime
    })

}

export { register, verifyUser, login, getMe }
