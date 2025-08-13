'use client';

import { Box, Container, Typography, Card, CardContent, Button } from '@mui/material';
import { CheckCircle } from '@mui/icons-material';

interface PricingSectionProps {
  onGetStartedClick: () => void;
}

const PricingSection = ({ onGetStartedClick }: PricingSectionProps) => {
  return (
    <Container maxWidth="md" sx={{ textAlign: 'center' }}>
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
        Simple, Transparent Pricing
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
        Get started with review monitoring across all major app stores
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Card
          sx={{
            maxWidth: 400,
            width: '100%',
            border: '2px solid',
            borderColor: 'primary.main',
            borderRadius: 3,
            position: 'relative',
            overflow: 'visible'
          }}
        >
          {/* Free Badge */}
          <Box
            sx={{
              position: 'absolute',
              top: -12,
              left: '50%',
              transform: 'translateX(-50%)',
              bgcolor: 'success.main',
              color: 'white',
              px: 3,
              py: 1,
              borderRadius: 2,
              fontSize: '0.875rem',
              fontWeight: 600
            }}
          >
            FREE FOR NOW
          </Box>

          <CardContent sx={{ p: 4, pt: 5 }}>
            <Typography variant="h4" component="h3" sx={{ fontWeight: 700, mb: 2 }}>
              Pro Plan
            </Typography>
            
            <Box sx={{ mb: 3 }}>
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
              <Typography variant="body2" color="text.secondary">
                per month
              </Typography>
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: 'success.main',
                mb: 4
              }}
            >
              FREE
            </Typography>

            <Box sx={{ textAlign: 'left', mb: 4 }}>
              {[
                'Monitor Chrome Web Store reviews',
                'Track Google Play Store feedback',
                'Watch Apple App Store reviews',
                'Real-time email notifications',
                'Unlimited app tracking',
                'Review analytics dashboard'
              ].map((feature, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CheckCircle sx={{ color: 'success.main', mr: 2, fontSize: '1.25rem' }} />
                  <Typography variant="body1">{feature}</Typography>
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
              Get Started Free
            </Button>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 2, fontStyle: 'italic' }}
            >
              No credit card required • Start monitoring immediately
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Typography
        variant="body1"
        color="text.secondary"
        sx={{ maxWidth: '500px', mx: 'auto' }}
      >
        We're currently in beta and offering our full feature set completely free. 
        Take advantage of this limited-time opportunity to set up your review monitoring system.
      </Typography>
    </Container>
  );
};

export default PricingSection;