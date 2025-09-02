'use client';

import React, { useCallback, useRef, useEffect } from 'react';
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

const SEARCH_DEBOUNCE_DELAY = 500; // ms

const ReviewFilters: React.FC<ReviewFiltersProps> = React.memo(({ filters, onFiltersChange }) => {
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const handlePlatformChange = useCallback((event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    onFiltersChange({
      ...filters,
      platform: value === 'all' ? undefined : value as 'GooglePlay' | 'AppleStore' | 'ChromeExt'
    });
  }, [filters, onFiltersChange]);

  const handleRatingChange = useCallback((event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    onFiltersChange({
      ...filters,
      rating: value === 'all' ? undefined : parseInt(value)
    });
  }, [filters, onFiltersChange]);

  const handleSentimentChange = useCallback((event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    onFiltersChange({
      ...filters,
      sentiment: value === 'all' ? undefined : value as 'POSITIVE' | 'NEGATIVE'
    });
  }, [filters, onFiltersChange]);

  const handleQuestChange = useCallback((event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    onFiltersChange({
      ...filters,
      quest: value === 'all' ? undefined : value as 'BUG' | 'FEATURE_REQUEST' | 'OTHER'
    });
  }, [filters, onFiltersChange]);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = event.target.value;

    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(() => {
      onFiltersChange({
        ...filters,
        search: searchValue || undefined
      });
    }, SEARCH_DEBOUNCE_DELAY);
  }, [filters, onFiltersChange]);

  const clearAllFilters = useCallback(() => {
    onFiltersChange({});
  }, [onFiltersChange]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

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
        <Grid item xs={12} md={6} lg={12}>
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
        <Grid item xs={12} md={6} lg={12}>
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
              Platform
            </Typography>
            <select
              value={filters.platform || 'all'}
              onChange={(e) => handlePlatformChange({ target: { value: e.target.value } } as SelectChangeEvent<string>)}
              style={{
                width: '100%',
                padding: '8.5px 14px',
                border: '1px solid rgba(0, 0, 0, 0.23)',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
                backgroundColor: 'white',
                cursor: 'pointer',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#1976d2';
                e.target.style.borderWidth = '2px';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0, 0, 0, 0.23)';
                e.target.style.borderWidth = '1px';
              }}
            >
              <option value="all">All Platforms</option>
              <option value="GooglePlay">Google Play</option>
              <option value="AppleStore">Apple App Store</option>
              <option value="ChromeExt">Chrome Web Store</option>
            </select>
          </Box>
        </Grid>

        {/* Rating Filter */}
        <Grid item xs={12} md={6} lg={12}>
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
              Rating
            </Typography>
            <select
              value={filters.rating?.toString() || 'all'}
              onChange={(e) => handleRatingChange({ target: { value: e.target.value } } as SelectChangeEvent<string>)}
              style={{
                width: '100%',
                padding: '8.5px 14px',
                border: '1px solid rgba(0, 0, 0, 0.23)',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
                backgroundColor: 'white',
                cursor: 'pointer',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#1976d2';
                e.target.style.borderWidth = '2px';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0, 0, 0, 0.23)';
                e.target.style.borderWidth = '1px';
              }}
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </Box>
        </Grid>

        {/* Sentiment Filter */}
        <Grid item xs={12} md={6} lg={12}>
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
              Sentiment
            </Typography>
            <select
              value={filters.sentiment || 'all'}
              onChange={(e) => handleSentimentChange({ target: { value: e.target.value } } as SelectChangeEvent<string>)}
              style={{
                width: '100%',
                padding: '8.5px 14px',
                border: '1px solid rgba(0, 0, 0, 0.23)',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
                backgroundColor: 'white',
                cursor: 'pointer',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#1976d2';
                e.target.style.borderWidth = '2px';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0, 0, 0, 0.23)';
                e.target.style.borderWidth = '1px';
              }}
            >
              <option value="all">All Sentiment</option>
              <option value="POSITIVE">Positive</option>
              <option value="NEGATIVE">Negative</option>
            </select>
          </Box>
        </Grid>

        {/* Quest Type Filter */}
        <Grid item xs={12} md={6} lg={12}>
          <Box>
            <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary', fontSize: '0.75rem' }}>
              Quest Type
            </Typography>
            <select
              value={filters.quest || 'all'}
              onChange={(e) => handleQuestChange({ target: { value: e.target.value } } as SelectChangeEvent<string>)}
              style={{
                width: '100%',
                padding: '8.5px 14px',
                border: '1px solid rgba(0, 0, 0, 0.23)',
                borderRadius: '4px',
                fontSize: '14px',
                fontFamily: 'inherit',
                backgroundColor: 'white',
                cursor: 'pointer',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#1976d2';
                e.target.style.borderWidth = '2px';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(0, 0, 0, 0.23)';
                e.target.style.borderWidth = '1px';
              }}
            >
              <option value="all">All Types</option>
              <option value="BUG">Bug Reports</option>
              <option value="FEATURE_REQUEST">Feature Requests</option>
              <option value="OTHER">Other</option>
            </select>
          </Box>
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
});

ReviewFilters.displayName = 'ReviewFilters';

export default ReviewFilters;