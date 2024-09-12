import UserModel from "../models/server/user";

export const getUser = async (uid: string) => {
    return await UserModel.findOne({ uid });
}