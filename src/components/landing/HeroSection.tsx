'use client';

import { Box, Typography, Button, Container, Stack, Chip, Avatar, useTheme } from '@mui/material';
import { RocketLaunch, Info, PlayCircle, Star, TrendingUp, Security, Speed } from '@mui/icons-material';
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
  const theme = useTheme();

  const getSecondaryIcon = (text: string) => {
    if (text.toLowerCase().includes('demo')) {
      return <PlayCircle sx={{ mr: 1 }} aria-hidden="true" />;
    }
    if (text.toLowerCase().includes('learn') || text.toLowerCase().includes('more')) {
      return <Info sx={{ mr: 1 }} aria-hidden="true" />;
    }
    return null;
  };

  const trustIndicators = [
    { icon: <Security />, text: 'Enterprise Security' },
    { icon: <Speed />, text: 'Real-time Updates' },
    { icon: <TrendingUp />, text: 'AI-Powered Insights' }
  ];

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: { xs: '80vh', md: '90vh' },
        display: 'flex',
        alignItems: 'center',
        background: `linear-gradient(135deg, 
          ${theme.palette.primary.main}15 0%, 
          ${theme.palette.secondary.main}10 50%, 
          ${theme.palette.primary.light}08 100%)`,
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 80%, ${theme.palette.primary.main}20 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, ${theme.palette.secondary.main}15 0%, transparent 50%)`,
          pointerEvents: 'none'
        }
      }}
    >
      {/* Floating Elements */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          right: '10%',
          width: { xs: 60, md: 80 },
          height: { xs: 60, md: 80 },
          borderRadius: '50%',
          background: `linear-gradient(45deg, ${theme.palette.primary.main}30, ${theme.palette.secondary.main}20)`,
          animation: 'float 6s ease-in-out infinite',
          '@keyframes float': {
            '0%, 100%': { transform: 'translateY(0px)' },
            '50%': { transform: 'translateY(-20px)' }
          }
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '15%',
          left: '5%',
          width: { xs: 40, md: 60 },
          height: { xs: 40, md: 60 },
          borderRadius: '30%',
          background: `linear-gradient(135deg, ${theme.palette.secondary.main}25, ${theme.palette.primary.light}15)`,
          animation: 'float 8s ease-in-out infinite reverse',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', py: { xs: 6, md: 8 } }}>
          {/* Badge */}
          <Chip
            icon={<Star sx={{ fontSize: '1rem !important' }} />}
            label="🚀 Now with AI-Powered Sentiment Analysis"
            sx={{
              mb: 4,
              px: 2,
              py: 1,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              fontWeight: 'medium',
              background: `linear-gradient(45deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}10)`,
              border: `1px solid ${theme.palette.primary.main}30`,
              color: theme.palette.primary.main,
              '& .MuiChip-icon': {
                color: theme.palette.secondary.main
              },
              animation: 'pulse 2s ease-in-out infinite',
              '@keyframes pulse': {
                '0%, 100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.05)' }
              }
            }}
          />

          {/* Main Heading with Gradient Text */}
          <Typography 
            variant="h1" 
            component="h1" 
            id="hero-heading"
            sx={{ 
              fontWeight: 800,
              mb: 3,
              fontSize: { xs: '2.5rem', sm: '3.5rem', md: '4.5rem', lg: '5rem' },
              lineHeight: { xs: 1.2, md: 1.1 },
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 4px 8px rgba(0,0,0,0.1)',
              letterSpacing: '-0.02em'
            }}
          >
            {title}
          </Typography>

          {/* Subtitle with Better Typography */}
          <Typography 
            variant="h5" 
            component="p" 
            sx={{ 
              mb: 6,
              fontSize: { xs: '1.125rem', sm: '1.375rem', md: '1.5rem' },
              maxWidth: '700px',
              mx: 'auto',
              lineHeight: 1.6,
              color: theme.palette.text.secondary,
              fontWeight: 400,
              opacity: 0.9
            }}
          >
            {subtitle}
          </Typography>

          {/* Trust Indicators */}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={3} 
            justifyContent="center"
            alignItems="center"
            sx={{ mb: 6 }}
          >
            {trustIndicators.map((indicator, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 2,
                  py: 1,
                  borderRadius: 2,
                  background: 'rgba(255, 255, 255, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)'
                  }
                }}
              >
                <Avatar
                  sx={{
                    width: 24,
                    height: 24,
                    bgcolor: theme.palette.primary.main,
                    '& svg': { fontSize: '0.875rem' }
                  }}
                >
                  {indicator.icon}
                </Avatar>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}
                >
                  {indicator.text}
                </Typography>
              </Box>
            ))}
          </Stack>
          
          {/* CTA Buttons with Modern Design */}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={3} 
            justifyContent="center"
            alignItems="center"
            sx={{ mt: 4 }}
          >
            <Button 
              variant="contained" 
              size="large" 
              onClick={onCtaClick}
              startIcon={<RocketLaunch aria-hidden="true" />}
              aria-label={`${ctaText} - Start using Review Alert`}
              sx={{ 
                px: 8,
                py: 3,
                fontSize: '1.25rem',
                fontWeight: 700,
                textTransform: 'none',
                minWidth: { xs: '280px', sm: 'auto' },
                borderRadius: 4,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                boxShadow: `0 8px 32px ${theme.palette.primary.main}40`,
                border: 'none',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                  transition: 'left 0.5s ease'
                },
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: `0 12px 40px ${theme.palette.primary.main}50`,
                  '&::before': {
                    left: '100%'
                  }
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
                size="large"
                onClick={action.onClick}
                startIcon={getSecondaryIcon(action.text)}
                aria-label={`${action.text} about Review Alert`}
                sx={{
                  px: 6,
                  py: 3,
                  fontSize: '1.125rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  minWidth: { xs: '280px', sm: 'auto' },
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  '&:hover': {
                    borderWidth: 2,
                    background: theme.palette.primary.main,
                    color: 'white',
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 24px ${theme.palette.primary.main}30`
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

          {/* Social Proof */}
          <Box sx={{ mt: 8, opacity: 0.8 }}>
            <Typography
              variant="body2"
              sx={{
                mb: 2,
                color: theme.palette.text.secondary,
                fontWeight: 500,
                fontSize: { xs: '0.875rem', sm: '1rem' }
              }}
            >
              Trusted by developers worldwide
            </Typography>
            <Stack
              direction="row"
              spacing={1}
              justifyContent="center"
              alignItems="center"
            >
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  sx={{
                    fontSize: '1.25rem',
                    color: '#FFD700',
                    filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                  }}
                />
              ))}
              <Typography
                variant="body2"
                sx={{
                  ml: 1,
                  fontWeight: 600,
                  color: theme.palette.text.primary
                }}
              >
                4.9/5 from 1,200+ reviews
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default HeroSection;