import User from '../model/User.model.js'
import crypto from 'crypto'
import sendMail from '../utils/nodemailer.js';
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import dotenv from "dotenv"

dotenv.config();

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
        sendMail("sandbox.smtp.mailtrap.io", "2271db6d4c05ab", "f1eee1877b918e", "someone", user.email, "verify your email", `click the link below to verify your email ${process.env.BASE_URL}/api/v1/users/verify/${generatedToken}`);

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
        // req.expiryTime = Date.now() + 60 * 60 //* 60; // adding 1 hour in miliseconds
        // console.log(req.expiryTime);
        res.status(200).json({
            success: true,
            message: "Login Successful",
        })
    } catch (error) {
        console.error("error in login controller", error);
    }
}

const getMe = async (req, res) => {
    // get token
    // validate token
    // get access to /me route
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
        return res.status(401).json({
            success: false,
            message: "No session token"
        });
    }
    // check expiry of the token
    console.log("req user", req.user);
    console.log("Date now", Date.now());
    if (req.expiryTime <= Date.now()) {
        return res.status(401).json({
            success: false,
            message: "session expired"
        })
    }
    res.status(200).json({
        success: true,
        user_info: user,
        expiryTime: req.expiryTime
    })
}

const logout = async (req, res) => {
    try {
        // req.cookies = undefined;
        // console.log("after clearing cookies", req.cookies);
        // res.cookie("token", null);

        // req.cookie ? res.cookie("token", "") : res.status(401).json({ message: "no token to clear", success: false });

        if (!req.cookie) return res.status(401).json({ success: false, message: "user not logged in" });


        res.status(200).json({
            succes: true,
            message: "Logged Out successfully"
        })

    } catch (error) {
        console.error("error in logout controller", error);
    }

}

const forgetPassword = async (req, res) => {
    // get email from user
    // validate user from database
    // set forgetPasswordToken
    // send mail to the user with token

    try {
        // getting user from email
        const email = req.body.email;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: "User not found"
            })
        }

        // set password token to database
        const token = crypto.randomBytes(32).toString("hex");
        console.log(token);
        user.forgetPasswordToken = token;

        // set forget password expiry
        user.resetPasswordExpiry = Date().now + 10 * 60 * 1000 // add 10 minutes from current time

        // save database
        user.save();

        // sending mail to user (forget password link)
        console.log("this is working fine for now")
        sendMail(process.env.HOST, process.env.user, process.env.PASS, process.env.FROM, user.email, "Reset password", `Click the link below to reset your password, or copy paste in the browser if it does not click: ${process.env.BASE_URL}/api/v1/users/resetPassword/${token}`);

        console.log("password reset link sent");

        res.status(200).json({
            success: true,
            message: "resetPassword success"
        })

    } catch (error) {
        console.error("error in forgetPassword controller: ", error);
    }
}

const resetPassword = async (req, res) => {
    // get token from params
    // validate user
    // let user change password

    const token = req.params.token;
    console.log("reset password Token: ", token);
    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Invalid token"
        })
    }

    // validate user
    try {
        const user = await User.findOne({ forgetPasswordToken: token });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid token"
            })
        }
        // let user reset password
        if (user.resetPasswordExpiry <= Date.now()) {
            return res.status(401).json({
                success: false,
                message: "reset password time expired"
            })
        }
        const password = req.body.password;

        user.password = password;

        // remove forgetpassword token and resetPasswordExpiry from database
        user.forgetPasswordToken = undefined;

        user.save(); // save database

        res.status(200).json({
            success: true,
            message: "password reset successful"
        })
    }
    catch (error) {
        console.error("error in forgetpassword token findone controller", error);
    }
}

export { register, verifyUser, login, getMe, logout, forgetPassword, resetPassword }
