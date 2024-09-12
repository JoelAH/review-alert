import ClientDashboard from "@/components/clientDashboard";
import dbConnect from "@/lib/db/db";
import { getUser } from "@/lib/db/user";
import { formatUser, User } from "@/lib/models/server/user";
import { checkAuth } from "@/lib/services/middleware";
import { AppBar, Button, Toolbar, Typography } from "@mui/material";

export default async function Dashboard() {
    const userClaims = await checkAuth();
    await dbConnect();

    let user: User | null = null;
    const res = await getUser(userClaims?.uid || '');
    if (res) {
        user = formatUser(res);
    }

    return (
        <>
            <AppBar position="static" color="transparent" elevation={0}>
                <Toolbar>
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#1976d2', fontWeight: 'bold' }}>
                        App Review <span style={{ color: '#FF6B6B' }}>Alert</span>
                    </Typography>
                    <Button size="small">Sign Out</Button>
                </Toolbar>
            </AppBar>
            <ClientDashboard user={user}/>
        </>
    )
}