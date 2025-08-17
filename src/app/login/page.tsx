import { checkAuth } from "@/lib/services/middleware";
import LoginClient from "./client";

export default async function LoginPage() {
    await checkAuth(true);

    return <LoginClient />
}