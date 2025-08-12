'use client';

import { Box, Typography, Button, Container, Stack } from '@mui/material';
import { RocketLaunch, Info, PlayCircle } from '@mui/icons-material';
import { HeroSectionProps, SecondaryAction } from '@/types/landing';

interface EnhancedHeroSectionProps extends HeroSectionProps {
  secondaryActions?: SecondaryAction[];
}

const HeroSection: React.FC<EnhancedHeroSectionProps> = ({
  title,
  subtitle,
  ctaText,
  onCtaClick,
  secondaryActions
}) => {
  const getSecondaryIcon = (text: string) => {
    if (text.toLowerCase().includes('demo')) {
      return <PlayCircle sx={{ mr: 1 }} aria-hidden="true" />;
    }
    if (text.toLowerCase().includes('learn') || text.toLowerCase().includes('more')) {
      return <Info sx={{ mr: 1 }} aria-hidden="true" />;
    }
    return null;
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 8, textAlign: 'center' }}>
        <Typography 
          variant="h1" 
          component="h1" 
          id="hero-heading"
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            mb: 3,
            fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
          }}
        >
          {title}
        </Typography>
        <Typography 
          variant="h5" 
          component="p" 
          color="textSecondary" 
          paragraph
          sx={{ 
            mb: 5,
            fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
            maxWidth: '800px',
            mx: 'auto',
            lineHeight: 1.6
          }}
        >
          {subtitle}
        </Typography>
        
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={3} 
          justifyContent="center"
          alignItems="center"
          sx={{ mt: 4 }}
        >
          <Button 
            variant="contained" 
            color="primary" 
            size="large" 
            onClick={onCtaClick}
            startIcon={<RocketLaunch aria-hidden="true" />}
            aria-label={`${ctaText} - Start using Review Alert`}
            sx={{ 
              px: 6,
              py: 2.5,
              fontSize: '1.2rem',
              fontWeight: 'bold',
              textTransform: 'none',
              minWidth: { xs: '250px', sm: 'auto' },
              borderRadius: 3,
              boxShadow: 4,
              '&:hover': {
                boxShadow: 8,
                transform: 'translateY(-2px)'
              },
              '&:focus': {
                outline: '3px solid #FFD700',
                outlineOffset: '2px'
              },
              transition: 'all 0.3s ease'
            }}
          >
            {ctaText}
          </Button>
          
          {secondaryActions && secondaryActions.map((action, index) => (
            <Button
              key={index}
              variant="outlined"
              color="primary"
              size="large"
              onClick={action.onClick}
              startIcon={getSecondaryIcon(action.text)}
              aria-label={`${action.text} about Review Alert`}
              sx={{
                px: 4,
                py: 2.5,
                fontSize: '1.1rem',
                fontWeight: 'medium',
                textTransform: 'none',
                minWidth: { xs: '250px', sm: 'auto' },
                borderRadius: 3,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  backgroundColor: 'primary.main',
                  color: 'white',
                  transform: 'translateY(-1px)'
                },
                '&:focus': {
                  outline: '3px solid #FFD700',
                  outlineOffset: '2px'
                },
                transition: 'all 0.3s ease'
              }}
            >
              {action.text}
            </Button>
          ))}
        </Stack>
      </Box>
    </Container>
  );
};

export default HeroSection;