"use client";

import { Button } from "@mui/material";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/firebase/auth";
import { signOutOfServer } from "@/lib/services/auth";

export default function SignOut() {
    const router = useRouter();

    const onSignOut = () => {
        signOut()
            .then(async () => {
                console.log('signingout');
                await signOutOfServer();
                router.replace('/');
            })
            .catch((e) => console.error(e));
    }

    return (
        <Button size="small" onClick={onSignOut}>Sign Out</Button>
    )
}