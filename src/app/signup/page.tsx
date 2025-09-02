import { checkAuth } from "@/lib/services/middleware";
import SignupClient from "./client";

export default async function SignupPage() {
    return <SignupClient />
}