import mongoose from 'mongoose';

export const connectDB = async function (dbConn: any, DB_URI: string) {
    if (dbConn == null) {
        dbConn = mongoose.connect(DB_URI, {
            serverSelectionTimeoutMS: 5000
        }).then(() => mongoose);
        await dbConn;
    }
    return dbConn;
};