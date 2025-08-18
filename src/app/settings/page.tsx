import ClientDashboard from "@/components/clientDashboard";
import dbConnect from "@/lib/db/db";
import { getUser } from "@/lib/db/user";
import { formatUser, User } from "@/lib/models/server/user";
import { checkAuth } from "@/lib/services/middleware";
import DashboardNavigation from "@/components/DashboardNavigation";

export default async function Settings() {
    const userClaims = await checkAuth();
    await dbConnect();

    let user: User | null = null;
    const res = await getUser(userClaims?.uid || '');
    if (res) {
        user = formatUser(res);
    }

    return (
        <>
            <DashboardNavigation />
            <ClientDashboard user={user}/>
        </>
    )
}