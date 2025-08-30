'use client';

import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  SelectChangeEvent,
  Chip,
  Typography
} from '@mui/material';
import { ReviewFiltersProps } from './types';

const ReviewFilters: React.FC<ReviewFiltersProps> = ({ filters, onFiltersChange }) => {
  const handlePlatformChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    onFiltersChange({
      ...filters,
      platform: value === 'all' ? undefined : value as 'GooglePlay' | 'AppleStore' | 'ChromeExt'
    });
  };

  const handleRatingChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    onFiltersChange({
      ...filters,
      rating: value === 'all' ? undefined : parseInt(value)
    });
  };

  const handleSentimentChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    onFiltersChange({
      ...filters,
      sentiment: value === 'all' ? undefined : value as 'POSITIVE' | 'NEGATIVE'
    });
  };

  const handleQuestChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    onFiltersChange({
      ...filters,
      quest: value === 'all' ? undefined : value as 'BUG' | 'FEATURE_REQUEST' | 'OTHER'
    });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      search: event.target.value || undefined
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({});
  };

  const getActiveFiltersCount = () => {
    return Object.values(filters).filter(value => value !== undefined && value !== '').length;
  };

  const getPlatformLabel = (platform: string) => {
    switch (platform) {
      case 'GooglePlay': return 'Google Play';
      case 'AppleStore': return 'Apple App Store';
      case 'ChromeExt': return 'Chrome Web Store';
      default: return platform;
    }
  };

  const getSentimentLabel = (sentiment: string) => {
    switch (sentiment) {
      case 'POSITIVE': return 'Positive';
      case 'NEGATIVE': return 'Negative';
      default: return sentiment;
    }
  };

  const getQuestLabel = (quest: string) => {
    switch (quest) {
      case 'BUG': return 'Bug Reports';
      case 'FEATURE_REQUEST': return 'Feature Requests';
      case 'OTHER': return 'Other';
      default: return quest;
    }
  };

  return (
    <Box sx={{ mb: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" component="h2">
          Filter Reviews
        </Typography>
        {getActiveFiltersCount() > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`${getActiveFiltersCount()} filter${getActiveFiltersCount() > 1 ? 's' : ''} active`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Chip
              label="Clear all"
              size="small"
              variant="outlined"
              onClick={clearAllFilters}
              sx={{ cursor: 'pointer' }}
            />
          </Box>
        )}
      </Box>

      <Grid container spacing={2}>
        {/* Search Field */}
        <Grid item xs={12} md={6} lg={3}>
          <TextField
            fullWidth
            label="Search reviews"
            variant="outlined"
            size="small"
            value={filters.search || ''}
            onChange={handleSearchChange}
            placeholder="Search by content..."
          />
        </Grid>

        {/* Platform Filter */}
        <Grid item xs={12} md={6} lg={2}>
          <FormControl fullWidth size="small">
            <InputLabel id="platform-filter-label">Platform</InputLabel>
            <Select
              labelId="platform-filter-label"
              value={filters.platform || 'all'}
              label="Platform"
              onChange={handlePlatformChange}
            >
              <MenuItem value="all">All Platforms</MenuItem>
              <MenuItem value="GooglePlay">Google Play</MenuItem>
              <MenuItem value="AppleStore">Apple App Store</MenuItem>
              <MenuItem value="ChromeExt">Chrome Web Store</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Rating Filter */}
        <Grid item xs={12} md={6} lg={2}>
          <FormControl fullWidth size="small">
            <InputLabel id="rating-filter-label">Rating</InputLabel>
            <Select
              labelId="rating-filter-label"
              value={filters.rating?.toString() || 'all'}
              label="Rating"
              onChange={handleRatingChange}
            >
              <MenuItem value="all">All Ratings</MenuItem>
              <MenuItem value="5">5 Stars</MenuItem>
              <MenuItem value="4">4 Stars</MenuItem>
              <MenuItem value="3">3 Stars</MenuItem>
              <MenuItem value="2">2 Stars</MenuItem>
              <MenuItem value="1">1 Star</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Sentiment Filter */}
        <Grid item xs={12} md={6} lg={2}>
          <FormControl fullWidth size="small">
            <InputLabel id="sentiment-filter-label">Sentiment</InputLabel>
            <Select
              labelId="sentiment-filter-label"
              value={filters.sentiment || 'all'}
              label="Sentiment"
              onChange={handleSentimentChange}
            >
              <MenuItem value="all">All Sentiment</MenuItem>
              <MenuItem value="POSITIVE">Positive</MenuItem>
              <MenuItem value="NEGATIVE">Negative</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Quest Type Filter */}
        <Grid item xs={12} md={6} lg={3}>
          <FormControl fullWidth size="small">
            <InputLabel id="quest-filter-label">Quest Type</InputLabel>
            <Select
              labelId="quest-filter-label"
              value={filters.quest || 'all'}
              label="Quest Type"
              onChange={handleQuestChange}
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="BUG">Bug Reports</MenuItem>
              <MenuItem value="FEATURE_REQUEST">Feature Requests</MenuItem>
              <MenuItem value="OTHER">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* Active Filters Display */}
      {getActiveFiltersCount() > 0 && (
        <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          <Typography variant="body2" sx={{ mr: 1, alignSelf: 'center' }}>
            Active filters:
          </Typography>
          {filters.platform && (
            <Chip
              label={`Platform: ${getPlatformLabel(filters.platform)}`}
              size="small"
              onDelete={() => onFiltersChange({ ...filters, platform: undefined })}
            />
          )}
          {filters.rating && (
            <Chip
              label={`Rating: ${filters.rating} star${filters.rating > 1 ? 's' : ''}`}
              size="small"
              onDelete={() => onFiltersChange({ ...filters, rating: undefined })}
            />
          )}
          {filters.sentiment && (
            <Chip
              label={`Sentiment: ${getSentimentLabel(filters.sentiment)}`}
              size="small"
              onDelete={() => onFiltersChange({ ...filters, sentiment: undefined })}
            />
          )}
          {filters.quest && (
            <Chip
              label={`Type: ${getQuestLabel(filters.quest)}`}
              size="small"
              onDelete={() => onFiltersChange({ ...filters, quest: undefined })}
            />
          )}
          {filters.search && (
            <Chip
              label={`Search: "${filters.search}"`}
              size="small"
              onDelete={() => onFiltersChange({ ...filters, search: undefined })}
            />
          )}
        </Box>
      )}
    </Box>
  );
};

export default ReviewFilters;