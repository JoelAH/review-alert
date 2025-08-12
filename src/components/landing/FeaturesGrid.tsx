'use client';

import { Container, Grid, Typography, Box } from '@mui/material';
import { FeaturesGridProps } from '@/types/landing';
import FeatureCard from './FeatureCard';

const FeaturesGrid: React.FC<FeaturesGridProps> = ({ features }) => {
  return (
    <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3, md: 4 } }}>
      <Box sx={{ mb: { xs: 4, sm: 5, md: 6 }, textAlign: 'center' }}>
        <Typography 
          variant="h2" 
          component="h2" 
          id="features-heading"
          gutterBottom
          sx={{ 
            fontWeight: 'bold', 
            mb: { xs: 1, sm: 2 },
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
            px: { xs: 1, sm: 0 }
          }}
        >
          Powerful Features for Modern App Developers
        </Typography>
        <Typography 
          variant="h6" 
          color="textSecondary"
          sx={{ 
            maxWidth: '600px', 
            mx: 'auto',
            fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
            px: { xs: 2, sm: 1, md: 0 },
            lineHeight: { xs: 1.5, sm: 1.6 }
          }}
        >
          From review aggregation to AI-powered insights and gamified workflows
        </Typography>
      </Box>
      
      <Grid 
        container 
        spacing={{ xs: 2, sm: 3, md: 4 }} 
        sx={{ 
          mb: { xs: 6, sm: 7, md: 8 },
          // Ensure proper alignment on all screen sizes
          justifyContent: 'center'
        }}
      >
        {features.map((feature, index) => (
          <Grid 
            item 
            xs={12} 
            sm={6} 
            md={4} 
            key={index}
            sx={{
              display: 'flex',
              // Ensure cards stretch to full height on larger screens
              '& > *': {
                width: '100%'
              }
            }}
          >
            <FeatureCard {...feature} />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default FeaturesGrid;