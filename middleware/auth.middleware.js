import jwt from "jsonwebtoken"
export const isLoggedIn = async (req, res, next) => {
    // get cookies from user browswer
    try {
        const token = req.cookies?.token;

        // decode the token
        const decode = jwt.verify(token, process.env.JWT_SECRET_KEY);
        // store in req.user to access it in controller
        req.user = decode;
        // keep future time when it needs to be expired;

    } catch (error) {
        console.error("error in isLoggedIn middlware", error);
    }
    next();
}

