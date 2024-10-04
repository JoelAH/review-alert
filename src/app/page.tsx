import {
  AppBar,
  Card,
  CardContent,
  Container,
  Grid,
  Typography,
  Toolbar,
  Box
} from '@mui/material';
import { NotificationsActive, Star, Bolt } from '@mui/icons-material';
import AuthButton from '@/components/authButton';
import GetStarted from '@/components/getStarted';

const LandingPage = async () => {
  return (
    <div style={{ background: 'linear-gradient(to bottom, #bbdefb, #ffffff)', minHeight: '100vh' }}>
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: '#1976d2', fontWeight: 'bold' }}>
            App Review <span style={{ color: '#FF6B6B' }}>Alert</span>
          </Typography>
          {/* <Button color="inherit">Features</Button>
          <Button color="inherit">Pricing</Button>
          <Button variant="contained" color="primary" sx={{ ml: 2 }}>Sign Up</Button> */}
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg">
        <Box sx={{ my: 8, textAlign: 'center' }}>
          <Typography variant="h2" component="h1" gutterBottom>
            Stay on Top of Your App Reviews
          </Typography>
          <Typography variant="h5" component="p" color="textSecondary" paragraph>
            Get alerts for new reviews across Chrome Web Store, Google Play, and iOS App Store.
          </Typography>
          {/* <Button variant="contained" color="primary" size="large" sx={{ mt: 2 }}>
            Start Free Trial
          </Button> */}
          <AuthButton />
        </Box>

        <Grid container spacing={4} sx={{ mb: 8 }}>
          <Grid item xs={12} md={4}>
            <Card raised>
              <CardContent>
                <Box sx={{ fontSize: '3rem', color: '#1976d2', marginBottom: '1rem' }}>
                  <NotificationsActive fontSize="inherit" />
                </Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  Timely Alerts
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Stop refreshing the page. Get alerts when there are new reviews.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card raised>
              <CardContent>
                <Box sx={{ fontSize: '3rem', color: '#1976d2', marginBottom: '1rem' }}>
                  <Star fontSize="inherit" />
                </Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  Multi-Store Support
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Monitor reviews across Chrome Web Store, Google Play, and iOS App Store.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card raised>
              <CardContent>
                <Box sx={{ fontSize: '3rem', color: '#1976d2', marginBottom: '1rem' }}>
                  <Bolt fontSize="inherit" />
                </Box>
                <Typography variant="h5" component="h2" gutterBottom>
                  Coming Soon: Insights
                </Typography>
                <Typography variant="body1" color="textSecondary">
                  Get smart analysis and actionable insights from your reviews.*
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h4" component="h2" gutterBottom>
            Ready to stay on top of your app reviews?
          </Typography>
          <GetStarted />
        </Box>
      </Container>

      <Box component="footer" sx={{ bgcolor: 'background.paper', py: 6 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          <small>* Not yet implemented. Coming soon</small>
          © 2024 AppReviewAlert. All rights reserved.
        </Typography>
      </Box>
    </div>
  );
};

export default LandingPage;