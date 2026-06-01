import mongoose from 'mongoose';
import 'dotenv/config';

const connectDB = async () => {
    try {
        mongoose.connection.on('connected', () => 
            console.log('Database connected successfully')
        );   
        await mongoose.connect(`${process.env.MONGO_URI}/quickgpt`);
    } catch (error) {
        
        console.error("Database connection error:", error); 
    }
}

export default connectDB;