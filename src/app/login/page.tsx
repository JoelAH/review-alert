import { checkAuth } from "@/lib/services/middleware";
import LoginClient from "./client";

export default async function LoginPage() {
    return <LoginClient />
}