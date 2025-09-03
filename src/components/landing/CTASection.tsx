'use client';

import { Box, Typography, Button, Container, Stack } from '@mui/material';
import { CTAProps } from '@/types/landing';

const CTASection: React.FC<CTAProps> = ({
  title,
  description,
  ctaText,
  onCtaClick,
  variant = 'primary',
  secondaryActions
}) => {
  return (
    <Container maxWidth="md">
      <Box 
        sx={{ 
          textAlign: 'center',
          py: 8,
          px: { xs: 2, sm: 4, md: 6 },
          backgroundColor: variant === 'primary' ? 'primary.main' : 'background.paper',
          color: variant === 'primary' ? 'primary.contrastText' : 'text.primary',
          borderRadius: 2,
          boxShadow: variant === 'primary' ? 4 : 1
        }}
      >
        <Typography 
          variant="h2" 
          component="h2" 
          id={variant === 'primary' ? 'final-cta-heading' : 'midpage-cta-heading'}
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            mb: 3,
            fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.75rem' }
          }}
        >
          {title}
        </Typography>
        
        {description && (
          <Typography 
            variant="h6" 
            component="p" 
            sx={{ 
              mb: 4,
              opacity: 0.9,
              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
              maxWidth: '600px',
              mx: 'auto',
              lineHeight: 1.6
            }}
          >
            {description}
          </Typography>
        )}
        
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          spacing={2} 
          justifyContent="center"
          alignItems="center"
        >
          <Button 
            variant={variant === 'primary' ? 'contained' : 'contained'}
            color={variant === 'primary' ? 'secondary' : 'primary'}
            size="large" 
            onClick={onCtaClick}
            aria-label={`${ctaText} - Get started with ReviewQuest`}
            sx={{ 
              px: 6,
              py: 2,
              fontSize: '1.2rem',
              fontWeight: 'bold',
              textTransform: 'none',
              minWidth: { xs: '200px', sm: 'auto' },
              '&:focus': {
                outline: '3px solid #FFD700',
                outlineOffset: '2px'
              }
            }}
          >
            {ctaText}
          </Button>
          
          {secondaryActions && secondaryActions.map((action, index) => (
            <Button
              key={index}
              variant="outlined"
              color={variant === 'primary' ? 'inherit' : 'primary'}
              size="large"
              onClick={action.onClick}
              aria-label={`${action.text} about ReviewQuest`}
              sx={{
                px: 4,
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 'medium',
                textTransform: 'none',
                minWidth: { xs: '200px', sm: 'auto' },
                borderColor: variant === 'primary' ? 'rgba(255, 255, 255, 0.5)' : undefined,
                color: variant === 'primary' ? 'inherit' : undefined,
                '&:hover': {
                  borderColor: variant === 'primary' ? 'rgba(255, 255, 255, 0.8)' : undefined,
                  backgroundColor: variant === 'primary' ? 'rgba(255, 255, 255, 0.1)' : undefined
                },
                '&:focus': {
                  outline: '3px solid #FFD700',
                  outlineOffset: '2px'
                }
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

export default CTASection;