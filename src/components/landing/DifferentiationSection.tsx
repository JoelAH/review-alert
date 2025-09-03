'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  useTheme
} from '@mui/material';
import {
  Close,
  CheckCircle,
  TrendingUp,
  AutoAwesome,
  AccountTree,
  EmojiEvents
} from '@mui/icons-material';
import { DifferentiationSectionProps } from '@/types/landing';

const DifferentiationSection: React.FC<DifferentiationSectionProps> = ({
  title,
  subtitle,
  comparisons,
  uniqueValue
}) => {
  const theme = useTheme();

  return (
    <Box sx={{ py: { xs: 6, sm: 7, md: 8 }, bgcolor: 'grey.50' }}>
      <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        {/* Section Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 5, md: 6 } }}>
          <Typography 
            variant="h2" 
            component="h2" 
            id="differentiation-heading"
            gutterBottom
            sx={{ 
              fontWeight: 'bold',
              color: 'primary.main',
              mb: { xs: 1, sm: 2 },
              fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
              px: { xs: 1, sm: 0 }
            }}
          >
            {title}
          </Typography>
          <Typography 
            variant="h6" 
            color="text.secondary"
            sx={{ 
              maxWidth: '800px', 
              mx: 'auto',
              fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
              px: { xs: 1, sm: 0, md: 0 },
              lineHeight: { xs: 1.5, sm: 1.6 }
            }}
          >
            {subtitle}
          </Typography>
        </Box>

        {/* Comparison Grid */}
        <Grid container spacing={{ xs: 3, sm: 3, md: 4 }} sx={{ mb: { xs: 6, sm: 7, md: 8 } }}>
          {comparisons.map((comparison, index) => (
            <Grid item xs={12} lg={6} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: { xs: 'none', sm: 'translateY(-4px)' },
                    boxShadow: { xs: 2, sm: theme.shadows[8] }
                  },
                  '&:active': {
                    transform: { xs: 'scale(0.98)', sm: 'translateY(-4px)' }
                  }
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
                  {/* Basic Approach */}
                  <Box sx={{ mb: { xs: 2.5, sm: 3 } }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: { xs: 1.5, sm: 2 },
                      flexWrap: { xs: 'wrap', sm: 'nowrap' }
                    }}>
                      <Close sx={{ 
                        color: 'error.main', 
                        mr: 1, 
                        fontSize: { xs: '1.125rem', sm: '1.25rem' }
                      }} aria-hidden="true" />
                      <Typography 
                        variant="subtitle2" 
                        color="error.main" 
                        fontWeight="bold"
                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                      >
                        Basic Review Monitoring
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        lineHeight: { xs: 1.4, sm: 1.5 }
                      }}
                    >
                      {comparison.basic}
                    </Typography>
                  </Box>

                  {/* ReviewQuest Approach */}
                  <Box sx={{ mb: { xs: 2.5, sm: 3 } }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: { xs: 1.5, sm: 2 },
                      flexWrap: { xs: 'wrap', sm: 'nowrap' }
                    }}>
                      <CheckCircle sx={{ 
                        color: 'success.main', 
                        mr: 1,
                        fontSize: { xs: '1.125rem', sm: '1.25rem' }
                      }} aria-hidden="true" />
                      <Typography 
                        variant="subtitle2" 
                        color="success.main" 
                        fontWeight="bold"
                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                      >
                        ReviewQuest
                      </Typography>
                    </Box>
                    <Typography 
                      variant="body2" 
                      color="text.primary"
                      sx={{ 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        lineHeight: { xs: 1.4, sm: 1.5 }
                      }}
                    >
                      {comparison.reviewQuest}
                    </Typography>
                  </Box>

                  {/* Benefit */}
                  <Box 
                    sx={{ 
                      bgcolor: 'primary.main',
                      color: 'white',
                      p: { xs: 1.5, sm: 2 },
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      flexDirection: { xs: 'column', sm: 'row' },
                      textAlign: { xs: 'center', sm: 'left' }
                    }}
                  >
                    <TrendingUp sx={{ 
                      mr: { xs: 0, sm: 1 }, 
                      mb: { xs: 1, sm: 0 },
                      fontSize: { xs: '1rem', sm: '1.2rem' }
                    }} aria-hidden="true" />
                    <Typography 
                      variant="body2" 
                      fontWeight="medium"
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      {comparison.benefit}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Unique Value Proposition */}
        <Card 
          sx={{ 
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            color: 'white',
            p: { xs: 3, sm: 4 }
          }}
        >
          <CardContent>
            <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: { xs: 1.5, sm: 2 } }}>
                <AutoAwesome sx={{ 
                  fontSize: { xs: '2.5rem', sm: '2.75rem', md: '3rem' }, 
                  color: 'white' 
                }} aria-hidden="true" />
              </Box>
              <Typography 
                variant="h4" 
                component="h3" 
                gutterBottom 
                fontWeight="bold"
                sx={{ 
                  fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
                  mb: { xs: 1.5, sm: 2 }
                }}
              >
                {uniqueValue.title}
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  opacity: 0.9, 
                  maxWidth: '800px', 
                  mx: 'auto',
                  fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
                  px: { xs: 1, sm: 0 },
                  lineHeight: { xs: 1.5, sm: 1.6 }
                }}
              >
                {uniqueValue.description}
              </Typography>
            </Box>

            <Grid container spacing={{ xs: 2, sm: 3 }}>
              {uniqueValue.highlights.map((highlight, index) => {
                const [title, description] = highlight.split(': ');
                const icons = [AccountTree, EmojiEvents, AutoAwesome, CheckCircle];
                const IconComponent = icons[index % icons.length];
                
                return (
                  <Grid item xs={12} sm={6} key={index}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      mb: { xs: 1.5, sm: 2 },
                      flexDirection: { xs: 'column', sm: 'row' },
                      textAlign: { xs: 'center', sm: 'left' }
                    }}>
                      <IconComponent 
                        sx={{ 
                          color: 'white', 
                          mr: { xs: 0, sm: 2 }, 
                          mb: { xs: 1, sm: 0 },
                          mt: { xs: 0, sm: 0.5 },
                          fontSize: { xs: '1.25rem', sm: '1.5rem' }
                        }} 
                        aria-hidden="true"
                      />
                      <Box>
                        <Typography 
                          variant="subtitle1" 
                          fontWeight="bold" 
                          gutterBottom
                          sx={{ 
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            mb: { xs: 0.5, sm: 1 }
                          }}
                        >
                          {title}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            opacity: 0.9,
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            lineHeight: { xs: 1.4, sm: 1.5 }
                          }}
                        >
                          {description}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};

export default DifferentiationSection;