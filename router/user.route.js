import { Router } from "express";
import { getMe, login, logout, register, verifyUser, forgetPassword, resetPassword } from "../controller/user.controller.js"
import { isLoggedIn } from "../middleware/auth.middleware.js";
const route = Router();
// route.get('/', home);
route.post('/register', register);
route.get('/verify/:token', verifyUser);
route.post('/login', login);
route.get('/me', isLoggedIn, getMe);
route.get('/logout', logout);
route.post('/forgetPassword', forgetPassword);
route.post('/resetPassword/:token', resetPassword);
export default route;
