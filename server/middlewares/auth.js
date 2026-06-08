import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export const protect = async(req, res, next) => {
    let token = req.headers.authorization;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);

        if(!user){
            return res.json({
                success:false,
                message:"user not found"
            });
        }

        req.user = user;
        next();

    } catch(error) {
        console.error("Auth error:", error.message);

        res.status(401).json({
            message:"not authorized token failed"
        });
    }
}
