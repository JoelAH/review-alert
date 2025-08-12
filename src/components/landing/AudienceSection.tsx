'use client';

import { 
  Container, 
  Box, 
  Typography, 
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { Close, CheckCircle } from '@mui/icons-material';
import { AudienceSectionProps } from '@/types/landing';

const AudienceSection: React.FC<AudienceSectionProps> = ({ personas }) => {
  return (
    <Container maxWidth="lg" sx={{ px: { xs: 1, sm: 3, md: 4 } }}>
      <Box sx={{ mb: { xs: 4, sm: 5, md: 6 }, textAlign: 'center' }}>
        <Typography 
          variant="h2" 
          component="h2" 
          id="audience-heading"
          gutterBottom
          sx={{ 
            fontWeight: 'bold', 
            mb: { xs: 1, sm: 2 },
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
            px: { xs: 1, sm: 0 }
          }}
        >
          Built for Solo Entrepreneurs & Small Teams
        </Typography>
        <Typography 
          variant="h6" 
          color="textSecondary"
          sx={{ 
            maxWidth: '700px', 
            mx: 'auto',
            fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
            px: { xs: 1, sm: 1, md: 0 },
            lineHeight: { xs: 1.5, sm: 1.6 }
          }}
        >
          We understand the unique challenges of resource-constrained teams and solo developers
        </Typography>
      </Box>

      <Grid container spacing={{ xs: 3, sm: 4 }} sx={{ mb: { xs: 6, sm: 7, md: 8 } }}>
        {personas.map((persona, index) => (
          <Grid item xs={12} sm={6} lg={4} key={index}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
              '&:hover': {
                transform: { xs: 'none', sm: 'translateY(-2px)' },
                boxShadow: { xs: 2, sm: 4 }
              }
            }}>
              <CardContent sx={{ flexGrow: 1, p: { xs: 2.5, sm: 3 } }}>
                <Typography 
                  variant="h5" 
                  component="h3" 
                  gutterBottom
                  sx={{ 
                    fontWeight: 'bold', 
                    color: 'primary.main', 
                    mb: { xs: 1.5, sm: 2 },
                    fontSize: { xs: '1.125rem', sm: '1.25rem', md: '1.5rem' }
                  }}
                >
                  {persona.title}
                </Typography>
                
                <Typography 
                  variant="body1" 
                  color="textSecondary"
                  sx={{ 
                    mb: { xs: 2.5, sm: 3 }, 
                    lineHeight: { xs: 1.5, sm: 1.6 },
                    fontSize: { xs: '0.875rem', sm: '1rem' }
                  }}
                >
                  {persona.description}
                </Typography>

                <Typography 
                  variant="h6" 
                  component="h4" 
                  sx={{ 
                    fontWeight: 'bold', 
                    mb: { xs: 1.5, sm: 2 }, 
                    color: 'error.main',
                    fontSize: { xs: '1rem', sm: '1.125rem' }
                  }}
                >
                  Pain Points:
                </Typography>
                <List dense sx={{ mb: { xs: 2.5, sm: 3 }, pl: 0 }}>
                  {persona.painPoints.map((point, pointIndex) => (
                    <ListItem key={pointIndex} sx={{ px: 0, py: { xs: 0.25, sm: 0.5 } }}>
                      <ListItemIcon sx={{ minWidth: { xs: 28, sm: 32 } }}>
                        <Close sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, color: 'error.main' }} aria-hidden="true" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={point}
                        primaryTypographyProps={{ 
                          variant: 'body2',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          lineHeight: { xs: 1.4, sm: 1.5 }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>

                <Typography 
                  variant="h6" 
                  component="h4" 
                  sx={{ 
                    fontWeight: 'bold', 
                    mb: { xs: 1.5, sm: 2 }, 
                    color: 'success.main',
                    fontSize: { xs: '1rem', sm: '1.125rem' }
                  }}
                >
                  How We Help:
                </Typography>
                <List dense sx={{ pl: 0 }}>
                  {persona.benefits.map((benefit, benefitIndex) => (
                    <ListItem key={benefitIndex} sx={{ px: 0, py: { xs: 0.25, sm: 0.5 } }}>
                      <ListItemIcon sx={{ minWidth: { xs: 28, sm: 32 } }}>
                        <CheckCircle sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, color: 'success.main' }} aria-hidden="true" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={benefit}
                        primaryTypographyProps={{ 
                          variant: 'body2',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          lineHeight: { xs: 1.4, sm: 1.5 }
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default AudienceSection;