import { Router } from "express";
import { getMe, login, register, verifyUser } from "../controller/user.controller.js"
import { isLoggedIn } from "../middleware/auth.middleware.js";
const route = Router();
// route.get('/', home);
route.post('/register', register);
route.get('/verify/:token', verifyUser);
route.post('/login', login);
route.get('/me', isLoggedIn, getMe);
export default route;
