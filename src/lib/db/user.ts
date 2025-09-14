import UserModel from "../models/server/user";

export const getUser = async (uid: string) => {
    return await UserModel.findOne({ uid });
}
export const insertUser = async (uid: string) => {
    return await UserModel.insertMany([
        {
            uid,
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ])
}