import { User } from "firebase/auth";
import { httpRequest } from "./request";

export async function signInToServer(user: User | null) {
    if (!user) {
        return;
    }
    return httpRequest('/api/login', 'POST', {
        Authorization: `Bearer ${await user.getIdToken()}`,
    })
}

export async function signOutOfServer() {
    return httpRequest('/api/signout', 'POST')
}