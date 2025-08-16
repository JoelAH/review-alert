import React from 'react';
import { render, screen } from '@testing-library/react';
import Breadcrumbs from '../Breadcrumbs';

describe('Breadcrumbs Component', () => {
  const mockItems = [
    { label: 'Home', href: '/' },
    { label: 'Authentication', href: '/auth' },
    { label: 'Login', current: true }
  ];

  it('should render breadcrumb items correctly', () => {
    render(<Breadcrumbs items={mockItems} />);
    
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Authentication')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('should render links for non-current items', () => {
    render(<Breadcrumbs items={mockItems} />);
    
    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', '/');
    
    const authLink = screen.getByRole('link', { name: 'Authentication' });
    expect(authLink).toHaveAttribute('href', '/auth');
  });

  it('should not render link for current item', () => {
    render(<Breadcrumbs items={mockItems} />);
    
    const loginText = screen.getByText('Login');
    expect(loginText).not.toHaveAttribute('href');
    expect(loginText).toHaveAttribute('aria-current', 'page');
  });

  it('should render last item as current when no current flag is set', () => {
    const itemsWithoutCurrent = [
      { label: 'Home', href: '/' },
      { label: 'Login' }
    ];
    
    render(<Breadcrumbs items={itemsWithoutCurrent} />);
    
    const loginText = screen.getByText('Login');
    expect(loginText).toHaveAttribute('aria-current', 'page');
  });

  it('should not render when items array is empty', () => {
    const { container } = render(<Breadcrumbs items={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when items is undefined', () => {
    const { container } = render(<Breadcrumbs items={undefined as any} />);
    expect(container.firstChild).toBeNull();
  });

  it('should have proper accessibility attributes', () => {
    render(<Breadcrumbs items={mockItems} />);
    
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb navigation' });
    expect(nav).toBeInTheDocument();
    
    const breadcrumbList = screen.getByLabelText('breadcrumb');
    expect(breadcrumbList).toBeInTheDocument();
  });

  it('should handle items without href', () => {
    const itemsWithoutHref = [
      { label: 'Home', href: '/' },
      { label: 'Static Item' },
      { label: 'Current', current: true }
    ];
    
    render(<Breadcrumbs items={itemsWithoutHref} />);
    
    expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByText('Static Item')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('should apply custom styles', () => {
    const customSx = { backgroundColor: 'red' };
    const { container } = render(<Breadcrumbs items={mockItems} sx={customSx} />);
    
    const nav = container.querySelector('[role="navigation"]');
    expect(nav).toHaveClass('MuiBox-root');
  });
});