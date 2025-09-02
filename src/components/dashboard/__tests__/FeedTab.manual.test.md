# FeedTab Manual Testing Guide

This document provides a comprehensive manual testing guide for the FeedTab component to verify all functionality, responsive design, and accessibility features.

## Prerequisites

1. Start the development server: `npm run dev`
2. Navigate to the dashboard and access the Feed tab
3. Ensure you have test data with reviews from different platforms

## Test Categories

### 1. Responsive Design Testing

#### Mobile Viewport (< 600px)
- [ ] **Layout Adaptation**
  - Resize browser to mobile width (375px)
  - Verify header stacks properly
  - Check that filter controls stack vertically
  - Confirm review cards are properly sized

- [ ] **Touch Interactions**
  - Test filter dropdowns with touch/tap
  - Verify buttons have adequate touch targets (44px minimum)
  - Check that hover effects are minimal/disabled

- [ ] **Content Overflow**
  - Test with long app names - should truncate with ellipsis
  - Test with long review comments - should wrap properly
  - Verify no horizontal scrolling occurs

#### Tablet Viewport (600px - 960px)
- [ ] **Grid Layout**
  - Verify filter controls use appropriate grid layout
  - Check that overview section adapts properly
  - Confirm review cards maintain good proportions

#### Desktop Viewport (> 960px)
- [ ] **Full Layout**
  - All filter controls visible in single row
  - Hover effects work properly on review cards
  - Adequate spacing between elements

### 2. Visual Indicators Testing

#### Platform Icons
- [ ] **Google Play Reviews**
  - Green Android icon displayed
  - Tooltip shows "Google Play" on hover
  - Icon size appropriate for viewport

- [ ] **Apple App Store Reviews**
  - Black Apple icon displayed
  - Tooltip shows "App Store" on hover
  - Icon size appropriate for viewport

- [ ] **Chrome Web Store Reviews**
  - Blue Extension icon displayed
  - Tooltip shows "Chrome Web Store" on hover
  - Icon size appropriate for viewport

#### Sentiment Indicators
- [ ] **Positive Sentiment**
  - Green left border on review card
  - Tooltip shows "Positive feedback"
  - Color meets contrast requirements

- [ ] **Negative Sentiment**
  - Red left border on review card
  - Tooltip shows "Negative feedback"
  - Color meets contrast requirements

- [ ] **Neutral/No Sentiment**
  - Gray left border on review card
  - Tooltip shows "Neutral feedback"

#### Quest Type Icons
- [ ] **Bug Reports**
  - Bug icon displayed with red color
  - Tooltip shows "Bug Report"
  - Icon size appropriate for viewport

- [ ] **Feature Requests**
  - Lightbulb icon displayed with orange color
  - Tooltip shows "Feature Request"
  - Icon size appropriate for viewport

- [ ] **Other Feedback**
  - Question mark icon displayed with blue color
  - Tooltip shows "Other Feedback"
  - Icon size appropriate for viewport

#### Priority Indicators
- [ ] **High Priority**
  - Red dot displayed
  - Tooltip shows "High Priority"
  - Dot size appropriate for viewport

- [ ] **Medium Priority**
  - Orange dot displayed
  - Tooltip shows "Medium Priority"
  - Dot size appropriate for viewport

- [ ] **Low Priority**
  - Gray dot displayed
  - Tooltip shows "Low Priority"
  - Dot size appropriate for viewport

### 3. Filter Functionality Testing

#### Platform Filter
- [ ] **Dropdown Options**
  - "All Platforms" option available
  - "Google Play" option available
  - "Apple App Store" option available
  - "Chrome Web Store" option available

- [ ] **Filter Application**
  - Select "Google Play" - only Google Play reviews shown
  - Select "Apple App Store" - only App Store reviews shown
  - Select "Chrome Web Store" - only Chrome extension reviews shown
  - Select "All Platforms" - all reviews shown

#### Rating Filter
- [ ] **Dropdown Options**
  - "All Ratings" through "1 Star" options available
  - Options display correctly (5 Stars, 4 Stars, etc.)

- [ ] **Filter Application**
  - Select "5 Stars" - only 5-star reviews shown
  - Select "1 Star" - only 1-star reviews shown
  - Combine with platform filter - both filters applied

#### Sentiment Filter
- [ ] **Dropdown Options**
  - "All Sentiment", "Positive", "Negative" options available

- [ ] **Filter Application**
  - Select "Positive" - only positive reviews shown
  - Select "Negative" - only negative reviews shown
  - Combine with other filters

#### Quest Type Filter
- [ ] **Dropdown Options**
  - "All Types", "Bug Reports", "Feature Requests", "Other" available

- [ ] **Filter Application**
  - Select "Bug Reports" - only bug-related reviews shown
  - Select "Feature Requests" - only feature request reviews shown
  - Combine with other filters

#### Search Functionality
- [ ] **Search Input**
  - Type in search box - debounced after 500ms
  - Search filters review content
  - Clear search - all reviews return

- [ ] **Active Filters Display**
  - Applied filters show as chips below controls
  - Individual filters can be removed via chip delete
  - "Clear all" button removes all filters
  - Filter count displays correctly (singular/plural)

### 4. Pagination and Loading Testing

#### Initial Loading
- [ ] **Skeleton States**
  - Full skeleton shown on initial load
  - Individual component skeletons for overview, filters
  - Skeleton adapts to viewport size

#### Infinite Scroll/Load More
- [ ] **Small Dataset (< 50 reviews)**
  - Regular review cards displayed
  - Load more button appears if hasMore is true
  - Button shows loading state when clicked

- [ ] **Large Dataset (> 50 reviews)**
  - Virtual scrolling component used
  - Smooth scrolling performance
  - All reviews accessible

#### Loading States
- [ ] **Loading More**
  - Loading skeleton appears below existing reviews
  - Button disabled during loading
  - New reviews append to list

- [ ] **End of List**
  - "You've reached the end" message when no more reviews
  - Total count displayed correctly

### 5. Error Handling Testing

#### Network Errors
- [ ] **API Failures**
  - Error alert displayed with retry options
  - Retry button attempts to reload data
  - Refresh button reloads entire component

#### Empty States
- [ ] **No Reviews**
  - Appropriate message when no reviews exist
  - "Check for Reviews" button available

- [ ] **No Filtered Results**
  - Message indicates no reviews match filters
  - "Clear All Filters" button available

- [ ] **Authentication Required**
  - Message shown when not authenticated
  - Appropriate call-to-action

### 6. Accessibility Testing

#### Keyboard Navigation
- [ ] **Tab Order**
  - Logical tab order through all interactive elements
  - Filter dropdowns accessible via keyboard
  - Buttons focusable and activatable with Enter/Space

- [ ] **Focus Management**
  - Visible focus indicators on all interactive elements
  - Focus maintained during dynamic content updates
  - No focus traps

#### Screen Reader Support
- [ ] **ARIA Labels**
  - All visual indicators have descriptive labels
  - Loading states announced properly
  - Error messages announced

- [ ] **Semantic Structure**
  - Proper heading hierarchy (h1, h2, etc.)
  - Lists and regions properly marked up
  - Form controls properly labeled

#### Color and Contrast
- [ ] **Visual Indicators**
  - Information not conveyed by color alone
  - Text alternatives for visual indicators
  - Sufficient color contrast ratios

### 7. Performance Testing

#### Large Datasets
- [ ] **Virtual Scrolling**
  - Smooth scrolling with 100+ reviews
  - Memory usage remains stable
  - No performance degradation

#### Filter Performance
- [ ] **Debounced Search**
  - Rapid typing doesn't cause excessive API calls
  - Search debounce works correctly (500ms)
  - Filter changes don't cause unnecessary re-renders

### 8. Integration Testing

#### Data Flow
- [ ] **API Integration**
  - Reviews load from correct endpoint
  - Filters passed correctly to API
  - Pagination parameters correct

- [ ] **Authentication Integration**
  - User-specific data loaded correctly
  - Session expiration handled gracefully

#### Component Integration
- [ ] **Overview Component**
  - Statistics calculated correctly
  - Updates when filters change
  - Responsive layout maintained

- [ ] **Review Cards**
  - All visual indicators display correctly
  - App information mapped correctly
  - Unknown apps handled gracefully

## Test Results

### Desktop Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Mobile Testing
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Mobile Firefox

### Accessibility Testing
- [ ] Screen reader (NVDA/JAWS/VoiceOver)
- [ ] Keyboard-only navigation
- [ ] High contrast mode
- [ ] Zoom to 200%

## Issues Found

Document any issues found during testing:

1. **Issue**: [Description]
   - **Severity**: High/Medium/Low
   - **Steps to Reproduce**: [Steps]
   - **Expected**: [Expected behavior]
   - **Actual**: [Actual behavior]

2. **Issue**: [Description]
   - **Severity**: High/Medium/Low
   - **Steps to Reproduce**: [Steps]
   - **Expected**: [Expected behavior]
   - **Actual**: [Actual behavior]

## Sign-off

- [ ] All responsive design tests passed
- [ ] All visual indicators working correctly
- [ ] All filter functionality working
- [ ] Pagination and loading states working
- [ ] Error handling working correctly
- [ ] Accessibility requirements met
- [ ] Performance acceptable
- [ ] Integration working properly

**Tester**: _______________  
**Date**: _______________  
**Browser/Device**: _______________  
**Notes**: _______________