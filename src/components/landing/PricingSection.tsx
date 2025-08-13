'use client';

import { Box, Container, Typography, Card, CardContent, Button, Grid } from '@mui/material';
import { CheckCircle, Close } from '@mui/icons-material';

interface PricingSectionProps {
  onGetStartedClick: () => void;
}

const PricingSection = ({ onGetStartedClick }: PricingSectionProps) => {
  const freeFeatures = [
    { text: 'Monitor Chrome Web Store reviews', included: true },
    { text: 'Track Google Play Store feedback', included: true },
    { text: 'Watch Apple App Store reviews', included: true },
    { text: 'Alerts every 4 hours', included: true },
    { text: 'Store reviews for 7 days', included: true },
    { text: 'Real-time notifications', included: false },
    { text: 'AI-powered insights', included: false },
    { text: 'Unlimited review history', included: false },
    { text: 'Automated task creation', included: false }
  ];

  const proFeatures = [
    { text: 'Monitor Chrome Web Store reviews', included: true },
    { text: 'Track Google Play Store feedback', included: true },
    { text: 'Watch Apple App Store reviews', included: true },
    { text: 'Real-time notifications', included: true },
    { text: 'AI-powered insights & analysis', included: true },
    { text: 'Unlimited review history', included: true },
    { text: 'Automated task creation', included: true },
    { text: 'Advanced analytics dashboard', included: true },
    { text: 'Priority support', included: true }
  ];

  return (
    <Container maxWidth="lg" sx={{ textAlign: 'center' }}>
      <Typography
        variant="h2"
        component="h2"
        id="pricing-heading"
        sx={{
          fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' },
          fontWeight: 700,
          mb: 2,
          color: 'text.primary'
        }}
      >
        Choose Your Plan
      </Typography>
      
      <Typography
        variant="h6"
        sx={{
          mb: 6,
          color: 'text.secondary',
          maxWidth: '600px',
          mx: 'auto',
          lineHeight: 1.6
        }}
      >
        Start free and upgrade when you need more powerful features
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {/* Free Plan */}
        <Grid item xs={12} md={6} lg={5}>
          <Card
            sx={{
              height: '100%',
              border: '1px solid',
              borderColor: 'grey.300',
              borderRadius: 3,
              position: 'relative'
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h4" component="h3" sx={{ fontWeight: 700, mb: 2 }}>
                Free
              </Typography>
              
              <Typography
                variant="h3"
                component="div"
                sx={{
                  fontWeight: 800,
                  mb: 1
                }}
              >
                $0
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                per month
              </Typography>

              <Box sx={{ textAlign: 'left', mb: 4 }}>
                {freeFeatures.map((feature, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {feature.included ? (
                      <CheckCircle sx={{ color: 'success.main', mr: 2, fontSize: '1.25rem' }} />
                    ) : (
                      <Close sx={{ color: 'grey.400', mr: 2, fontSize: '1.25rem' }} />
                    )}
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        color: feature.included ? 'text.primary' : 'text.secondary',
                        opacity: feature.included ? 1 : 0.6
                      }}
                    >
                      {feature.text}
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={onGetStartedClick}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                Get Started Free
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Pro Plan */}
        <Grid item xs={12} md={6} lg={5}>
          <Card
            sx={{
              height: '100%',
              border: '2px solid',
              borderColor: 'primary.main',
              borderRadius: 3,
              position: 'relative',
              overflow: 'visible'
            }}
          >
            {/* Popular Badge */}
            <Box
              sx={{
                position: 'absolute',
                top: -12,
                left: '50%',
                transform: 'translateX(-50%)',
                bgcolor: 'primary.main',
                color: 'white',
                px: 3,
                py: 1,
                borderRadius: 2,
                fontSize: '0.875rem',
                fontWeight: 600
              }}
            >
              MOST POPULAR
            </Box>

            <CardContent sx={{ p: 4, pt: 5 }}>
              <Typography variant="h4" component="h3" sx={{ fontWeight: 700, mb: 2 }}>
                Pro
              </Typography>
              
              <Box sx={{ mb: 1 }}>
                <Typography
                  variant="h3"
                  component="div"
                  sx={{
                    fontWeight: 800,
                    color: 'text.secondary',
                    textDecoration: 'line-through',
                    opacity: 0.6
                  }}
                >
                  $9.75
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                per month
              </Typography>

              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                  color: 'success.main',
                  mb: 4
                }}
              >
                FREE DURING BETA
              </Typography>

              <Box sx={{ textAlign: 'left', mb: 4 }}>
                {proFeatures.map((feature, index) => (
                  <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CheckCircle sx={{ color: 'success.main', mr: 2, fontSize: '1.25rem' }} />
                    <Typography variant="body1">{feature.text}</Typography>
                  </Box>
                ))}
              </Box>

              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={onGetStartedClick}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: 'none'
                }}
              >
                Start Pro Trial
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ maxWidth: '600px', mx: 'auto', mt: 6 }}
      >
        We're currently in beta and offering our Pro features completely free. 
        Start with any plan now and take advantage of this limited-time opportunity 
        to set up your complete review monitoring system.
      </Typography>
    </Container>
  );
};

export default PricingSection;