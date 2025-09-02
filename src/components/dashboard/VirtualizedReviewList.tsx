'use client';

import React, { useMemo } from 'react';
import { FixedSizeList } from 'react-window';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import { Review } from '@/lib/models/client/review';
import ReviewCard from './ReviewCard';
import { Platform } from './types';

interface VirtualizedReviewListProps {
  reviews: Review[];
  getAppInfoForReview: (review: Review) => { appName: string; platform: Platform };
  onQuestCreated?: (questId: string) => void;
  highlightedReviewId?: string | null;
  height?: number;
  itemHeight?: number;
  overscan?: number;
}

interface ListItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    reviews: Review[];
    getAppInfoForReview: (review: Review) => { appName: string; platform: Platform };
    onQuestCreated?: (questId: string) => void;
    highlightedReviewId?: string | null;
  };
}

const ListItem: React.FC<ListItemProps> = React.memo(({ index, style, data }) => {
  const { reviews, getAppInfoForReview, onQuestCreated, highlightedReviewId } = data;
  const review = reviews[index];
  const { appName, platform } = getAppInfoForReview(review);

  return (
    <div style={style}>
      <Box sx={{ px: 1, pb: 1 }}>
        <ReviewCard
          review={review}
          appName={appName}
          platform={platform}
          highlighted={highlightedReviewId === review._id}
          onQuestCreated={onQuestCreated}
        />
      </Box>
    </div>
  );
});

ListItem.displayName = 'VirtualizedListItem';

const VirtualizedReviewList: React.FC<VirtualizedReviewListProps> = ({
  reviews,
  getAppInfoForReview,
  onQuestCreated,
  highlightedReviewId,
  height = 600,
  itemHeight = 200,
  overscan = 5,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Adjust item height for mobile
  const adjustedItemHeight = isMobile ? itemHeight * 0.8 : itemHeight;

  // Memoize the data object to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    reviews,
    getAppInfoForReview,
    onQuestCreated,
    highlightedReviewId,
  }), [reviews, getAppInfoForReview, onQuestCreated, highlightedReviewId]);

  // Memoize the list height calculation
  const listHeight = useMemo(() => {
    const maxHeight = Math.min(height, reviews.length * adjustedItemHeight);
    return Math.max(200, maxHeight); // Minimum height of 200px
  }, [height, reviews.length, adjustedItemHeight]);

  if (reviews.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        width: '100%',
        height: listHeight,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        overflow: 'hidden',
      }}
    >
      <FixedSizeList
        height={listHeight}
        itemCount={reviews.length}
        itemSize={adjustedItemHeight}
        itemData={itemData}
        overscanCount={overscan}
        width="100%"
      >
        {ListItem}
      </FixedSizeList>
    </Box>
  );
};

export default React.memo(VirtualizedReviewList);