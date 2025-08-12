'use client';

import React from 'react';
import { Card, CardContent, Box, Typography } from '@mui/material';
import { FeatureCardProps } from '@/types/landing';

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  description,
  isPrimary = false
}) => {
  return (
    <Card 
      raised 
      role="article"
      aria-labelledby={`feature-${title.toLowerCase().replace(/\s+/g, '-')}`}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        border: isPrimary ? 2 : 0,
        borderColor: isPrimary ? 'secondary.main' : 'transparent',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        cursor: 'default',
        // Enhanced mobile experience
        minHeight: { xs: '200px', sm: '220px', md: '240px' },
        '&:hover': {
          transform: { xs: 'none', sm: 'translateY(-4px)' }, // Disable hover transform on mobile
          boxShadow: { xs: 2, sm: 4 }
        },
        // Better touch feedback on mobile
        '&:active': {
          transform: { xs: 'scale(0.98)', sm: 'translateY(-4px)' },
        },
        '&:focus-within': {
          outline: '3px solid #FFD700',
          outlineOffset: '2px'
        }
      }}
    >
      <CardContent 
        sx={{ 
          flexGrow: 1, 
          textAlign: 'center', 
          p: { xs: 2, sm: 2.5, md: 3 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between'
        }}
      >
        <Box>
          <Box 
            sx={{ 
              fontSize: { xs: '2.5rem', sm: '2.75rem', md: '3rem' }, 
              color: isPrimary ? 'secondary.main' : 'primary.main',
              marginBottom: { xs: '0.75rem', sm: '1rem' },
              display: 'flex',
              justifyContent: 'center',
              // Ensure icons are properly sized on all devices
              '& svg': {
                fontSize: 'inherit'
              }
            }}
            aria-hidden="true"
          >
            {React.createElement(icon as any, { fontSize: 'inherit', 'aria-hidden': 'true' })}
          </Box>
          
          <Typography 
            variant="h5" 
            component="h3" 
            id={`feature-${title.toLowerCase().replace(/\s+/g, '-')}`}
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              color: isPrimary ? 'secondary.main' : 'text.primary',
              fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' },
              mb: { xs: 1, sm: 1.5 },
              // Ensure text doesn't break awkwardly
              hyphens: 'auto',
              wordBreak: 'break-word'
            }}
          >
            {title}
          </Typography>
        </Box>
        
        <Typography 
          variant="body1" 
          color="textSecondary"
          sx={{ 
            lineHeight: { xs: 1.5, sm: 1.6 },
            fontSize: { xs: '0.875rem', sm: '1rem' },
            // Better text rendering on mobile
            textAlign: 'center',
            hyphens: 'auto',
            wordBreak: 'break-word'
          }}
        >
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default FeatureCard;