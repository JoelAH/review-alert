/**
 * Example usage of the useReviews hook
 * This file demonstrates how to use the hook in a React component
 */

import React from 'react';
import { useReviews, ReviewFilters } from './useReviews';
import { ReviewsService } from '../services/reviews';

// Example component using the useReviews hook
export function ReviewsExample() {
  const {
    reviews,
    loading,
    error,
    hasMore,
    totalCount,
    overview,
    page,
    loadMore,
    refresh,
    setFilters,
    clearError,
  } = useReviews();

  const handleFilterChange = (newFilters: ReviewFilters) => {
    setFilters(newFilters);
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadMore();
    }
  };

  if (error) {
    return (
      <div>
        <p>Error: {error}</p>
        <button onClick={clearError}>Clear Error</button>
        <button onClick={refresh}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      <h2>Reviews ({totalCount} total)</h2>
      
      {/* Overview Section */}
      {overview && (
        <div>
          <h3>Overview</h3>
          <p>Positive: {overview.sentimentBreakdown.positive}</p>
          <p>Negative: {overview.sentimentBreakdown.negative}</p>
          <p>Google Play: {overview.platformBreakdown.GooglePlay}</p>
          <p>App Store: {overview.platformBreakdown.AppleStore}</p>
          <p>Chrome: {overview.platformBreakdown.ChromeExt}</p>
        </div>
      )}

      {/* Filter Controls */}
      <div>
        <button onClick={() => handleFilterChange({ platform: 'GooglePlay' })}>
          Google Play Only
        </button>
        <button onClick={() => handleFilterChange({ sentiment: 'POSITIVE' })}>
          Positive Only
        </button>
        <button onClick={() => handleFilterChange({ rating: 5 })}>
          5 Stars Only
        </button>
        <button onClick={() => handleFilterChange({})}>
          Clear Filters
        </button>
      </div>

      {/* Reviews List */}
      <div>
        {reviews.map((review) => (
          <div key={review._id} style={{ border: '1px solid #ccc', margin: '10px', padding: '10px' }}>
            <h4>{review.name}</h4>
            <p>Rating: {review.rating}/5</p>
            <p>Sentiment: {review.sentiment}</p>
            <p>Quest: {review.quest}</p>
            <p>Priority: {review.priority}</p>
            <p>{review.comment}</p>
            <small>{new Date(review.date).toLocaleDateString()}</small>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <button onClick={handleLoadMore} disabled={loading}>
          {loading ? 'Loading...' : 'Load More'}
        </button>
      )}

      {/* Status */}
      <p>Page: {page} | Loading: {loading ? 'Yes' : 'No'}</p>
    </div>
  );
}

// Example of using the service directly
export async function directServiceExample() {
  try {
    // Fetch first page with filters
    const response = await ReviewsService.fetchReviews({
      page: 1,
      limit: 10,
      filters: {
        platform: 'GooglePlay',
        sentiment: 'POSITIVE',
      },
    });

    console.log('Reviews:', response.reviews);
    console.log('Has more:', response.hasMore);
    console.log('Total count:', response.totalCount);
    console.log('Overview:', response.overview);

    // Fetch only overview
    const overview = await ReviewsService.fetchOverview();
    console.log('Overview only:', overview);

  } catch (error) {
    console.error('Error fetching reviews:', error);
  }
}

// Example of using with abort controller
export function AbortableRequestExample() {
  const [abortController, setAbortController] = React.useState<AbortController | null>(null);

  const fetchWithAbort = async () => {
    // Cancel previous request if exists
    if (abortController) {
      abortController.abort();
    }

    const newController = new AbortController();
    setAbortController(newController);

    try {
      const response = await ReviewsService.fetchReviews({
        page: 1,
        limit: 20,
        signal: newController.signal,
      });

      console.log('Fetched reviews:', response.reviews.length);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Request was aborted');
      } else {
        console.error('Error:', error);
      }
    }
  };

  const cancelRequest = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  };

  return (
    <div>
      <button onClick={fetchWithAbort}>Fetch Reviews</button>
      <button onClick={cancelRequest}>Cancel Request</button>
    </div>
  );
}