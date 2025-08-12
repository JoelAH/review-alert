'use client';

import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Avatar,
  Grid,
  Container
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked,
  EmojiEvents,
  Star,
  TrendingUp,
  Assignment
} from '@mui/icons-material';
import { GamificationShowcaseProps } from '@/types/landing';

const GamificationShowcase: React.FC<GamificationShowcaseProps> = ({
  currentXP,
  currentLevel,
  nextLevelXP,
  recentTasks
}) => {
  // Calculate progress percentage for the XP bar
  const progressPercentage = (currentXP / nextLevelXP) * 100;
  
  // Mock achievement badges
  const achievements = [
    { id: 1, name: 'First Response', icon: <Star />, earned: true },
    { id: 2, name: 'Review Master', icon: <EmojiEvents />, earned: true },
    { id: 3, name: 'Trend Spotter', icon: <TrendingUp />, earned: false },
    { id: 4, name: 'Task Crusher', icon: <Assignment />, earned: true }
  ];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 6, sm: 7, md: 8 }, px: { xs: 2, sm: 3, md: 4 } }}>
      <Box textAlign="center" mb={{ xs: 4, sm: 5, md: 6 }}>
        <Typography 
          variant="h2" 
          component="h2" 
          id="gamification-heading"
          gutterBottom 
          fontWeight="bold"
          sx={{
            fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
            px: { xs: 1, sm: 0 }
          }}
        >
          Level Up Your Review Management
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary" 
          maxWidth="600px" 
          mx="auto"
          sx={{
            fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' },
            px: { xs: 2, sm: 1, md: 0 },
            lineHeight: { xs: 1.5, sm: 1.6 }
          }}
        >
          Turn review responses into XP, unlock achievements, and gamify your product development journey
        </Typography>
      </Box>

      <Grid container spacing={{ xs: 3, sm: 4 }} alignItems="stretch">
        {/* XP Progress Section */}
        <Grid item xs={12} lg={6}>
          <Card elevation={3} sx={{ height: '100%', p: { xs: 2, sm: 3 } }}>
            <CardContent>
              <Box 
                display="flex" 
                alignItems="center" 
                mb={3}
                flexDirection={{ xs: 'column', sm: 'row' }}
                textAlign={{ xs: 'center', sm: 'left' }}
              >
                <Avatar 
                  sx={{ 
                    bgcolor: 'primary.main', 
                    width: { xs: 64, sm: 56 }, 
                    height: { xs: 64, sm: 56 }, 
                    mr: { xs: 0, sm: 2 },
                    mb: { xs: 2, sm: 0 },
                    fontSize: { xs: '1.75rem', sm: '1.5rem' },
                    fontWeight: 'bold'
                  }}
                >
                  {currentLevel}
                </Avatar>
                <Box flex={1}>
                  <Typography 
                    variant="h5" 
                    fontWeight="bold"
                    sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}
                  >
                    Level {currentLevel} Developer
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                  >
                    {currentXP} / {nextLevelXP} XP
                  </Typography>
                </Box>
              </Box>
              
              <Box mb={2}>
                <LinearProgress
                  variant="determinate"
                  value={progressPercentage}
                  aria-label={`Experience progress: ${currentXP} out of ${nextLevelXP} XP`}
                  sx={{
                    height: { xs: 10, sm: 12 },
                    borderRadius: 6,
                    backgroundColor: 'grey.200',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: '#FFD700', // Gold color for XP
                      borderRadius: 6,
                    },
                  }}
                />
              </Box>
              
              <Typography 
                variant="body2" 
                color="text.secondary" 
                textAlign="center"
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                {nextLevelXP - currentXP} XP until Level {currentLevel + 1}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Achievement Badges Section */}
        <Grid item xs={12} lg={6}>
          <Card elevation={3} sx={{ height: '100%', p: { xs: 2, sm: 3 } }}>
            <CardContent>
              <Typography 
                variant="h6" 
                fontWeight="bold" 
                mb={3}
                sx={{ 
                  fontSize: { xs: '1.125rem', sm: '1.25rem' },
                  textAlign: { xs: 'center', sm: 'left' }
                }}
              >
                Achievement Badges
              </Typography>
              <Grid container spacing={{ xs: 1.5, sm: 2 }}>
                {achievements.map((achievement) => (
                  <Grid item xs={6} sm={6} key={achievement.id}>
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                      p={{ xs: 1, sm: 2 }}
                      sx={{
                        opacity: achievement.earned ? 1 : 0.4,
                        transition: 'opacity 0.3s ease',
                        minHeight: { xs: '80px', sm: '100px' },
                        justifyContent: 'center'
                      }}
                    >
                      <Badge
                        badgeContent={achievement.earned ? <CheckCircle sx={{ fontSize: { xs: 14, sm: 16 }, color: '#34C759' }} /> : null}
                        overlap="circular"
                        anchorOrigin={{
                          vertical: 'bottom',
                          horizontal: 'right',
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: achievement.earned ? '#9C27B0' : 'grey.300', // Purple for earned levels
                            width: { xs: 40, sm: 48 },
                            height: { xs: 40, sm: 48 },
                            mb: 1,
                          }}
                          aria-label={`${achievement.name} achievement ${achievement.earned ? 'earned' : 'not earned'}`}
                        >
                          {React.cloneElement(achievement.icon, { 
                            sx: { fontSize: { xs: '1rem', sm: '1.25rem' } },
                            'aria-hidden': 'true'
                          })}
                        </Avatar>
                      </Badge>
                      <Typography
                        variant="caption"
                        textAlign="center"
                        fontWeight={achievement.earned ? 'bold' : 'normal'}
                        color={achievement.earned ? 'text.primary' : 'text.secondary'}
                        sx={{ 
                          fontSize: { xs: '0.625rem', sm: '0.75rem' },
                          lineHeight: 1.2,
                          maxWidth: '80px'
                        }}
                      >
                        {achievement.name}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Tasks Section */}
        <Grid item xs={12}>
          <Card elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
            <CardContent>
              <Typography 
                variant="h6" 
                fontWeight="bold" 
                mb={3}
                sx={{ 
                  fontSize: { xs: '1.125rem', sm: '1.25rem' },
                  textAlign: { xs: 'center', sm: 'left' }
                }}
              >
                Recent Tasks & XP Rewards
              </Typography>
              <List sx={{ p: 0 }}>
                {recentTasks.map((task) => (
                  <ListItem
                    key={task.id}
                    sx={{
                      border: '1px solid',
                      borderColor: task.completed ? '#34C759' : 'grey.300',
                      borderRadius: 2,
                      mb: 1,
                      backgroundColor: task.completed ? 'rgba(52, 199, 89, 0.05)' : 'transparent',
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'stretch', sm: 'center' },
                      p: { xs: 2, sm: 1 },
                      gap: { xs: 1, sm: 0 }
                    }}
                  >
                    <Box 
                      display="flex" 
                      alignItems="center" 
                      width={{ xs: '100%', sm: 'auto' }}
                      flex={{ xs: 'none', sm: 1 }}
                    >
                      <ListItemIcon sx={{ minWidth: { xs: 32, sm: 40 } }}>
                        {task.completed ? (
                          <CheckCircle sx={{ color: '#34C759', fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                        ) : (
                          <RadioButtonUnchecked sx={{ color: 'grey.400', fontSize: { xs: '1.25rem', sm: '1.5rem' } }} />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={task.title}
                        primaryTypographyProps={{
                          fontWeight: task.completed ? 'bold' : 'normal',
                          color: task.completed ? 'text.primary' : 'text.secondary',
                          fontSize: { xs: '0.875rem', sm: '1rem' }
                        }}
                      />
                    </Box>
                    <Chip
                      label={`+${task.xpReward} XP`}
                      size="small"
                      sx={{
                        backgroundColor: task.completed ? '#34C759' : 'grey.300',
                        color: task.completed ? 'white' : 'text.secondary',
                        fontWeight: 'bold',
                        fontSize: { xs: '0.75rem', sm: '0.8125rem' },
                        alignSelf: { xs: 'center', sm: 'auto' },
                        minWidth: { xs: '60px', sm: 'auto' }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
              
              <Box mt={3} textAlign="center">
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  Complete tasks to earn XP and unlock new achievements!
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default GamificationShowcase;