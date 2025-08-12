'use client';

import { Box, Typography, Button, Container, Stack } from '@mui/material';
import { RocketLaunch, Explore, PlayCircle } from '@mui/icons-material';
import { SecondaryAction } from '@/types/landing';

interface MidPageCTAProps {
  title: string;
  description: string;
  primaryText: string;
  onPrimaryClick: () => void;
  secondaryActions?: SecondaryAction[];
}

const MidPageCTA: React.FC<MidPageCTAProps> = ({
  title,
  description,
  primaryText,
  onPrimaryClick,
  secondaryActions
}) => {
  const getIcon = (text: string) => {
    if (text.toLowerCase().includes('demo') || text.toLowerCase().includes('watch')) {
      return <PlayCircle sx={{ mr: 1 }} />;
    }
    if (text.toLowerCase().includes('explore') || text.toLowerCase().includes('learn')) {
      return <Explore sx={{ mr: 1 }} />;
    }
    return null;
  };

  return (
    <Box sx={{ py: 8, backgroundColor: 'grey.50' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', maxWidth: '800px', mx: 'auto' }}>
          <Typography 
            variant="h3" 
            component="h2" 
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              mb: 3,
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' },
              color: 'primary.main'
            }}
          >
            {title}
          </Typography>
          
          <Typography 
            variant="h6" 
            component="p" 
            sx={{ 
              mb: 5,
              color: 'text.secondary',
              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
              lineHeight: 1.6
            }}
          >
            {description}
          </Typography>
          
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={3} 
            justifyContent="center"
            alignItems="center"
          >
            <Button 
              variant="contained"
              color="primary"
              size="large" 
              onClick={onPrimaryClick}
              startIcon={<RocketLaunch />}
              sx={{ 
                px: 6,
                py: 2.5,
                fontSize: '1.2rem',
                fontWeight: 'bold',
                textTransform: 'none',
                minWidth: { xs: '250px', sm: 'auto' },
                borderRadius: 3,
                boxShadow: 3,
                '&:hover': {
                  boxShadow: 6,
                  transform: 'translateY(-2px)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              {primaryText}
            </Button>
            
            {secondaryActions && secondaryActions.map((action, index) => (
              <Button
                key={index}
                variant="outlined"
                color="primary"
                size="large"
                onClick={action.onClick}
                startIcon={getIcon(action.text)}
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
                    transform: 'translateY(-1px)'
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
    </Box>
  );
};

export default MidPageCTA;