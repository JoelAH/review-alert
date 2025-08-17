import { checkAuth } from "@/lib/services/middleware";
import SignupClient from "./client";

export default async function SignupPage() {
    await checkAuth(true);

    return <SignupClient />
}