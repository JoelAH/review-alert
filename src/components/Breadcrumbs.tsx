'use client';

import React from 'react';
import {
  Breadcrumbs as MUIBreadcrumbs,
  Link,
  Typography,
  Box,
  useTheme
} from '@mui/material';
import NextLink from 'next/link';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbsProps {
  /** Array of breadcrumb items */
  items: BreadcrumbItem[];
  /** Additional styling */
  sx?: object;
}

export default function Breadcrumbs({ items, sx }: BreadcrumbsProps) {
  const theme = useTheme();

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <Box
      sx={{
        py: 2,
        px: { xs: 2, sm: 3 },
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
        ...sx
      }}
      role="navigation"
      aria-label="Breadcrumb navigation"
    >
      <MUIBreadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{
          '& .MuiBreadcrumbs-separator': {
            color: theme.palette.text.secondary
          }
        }}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isCurrent = item.current || isLast;

          if (isCurrent || !item.href) {
            return (
              <Typography
                key={index}
                color="text.primary"
                sx={{
                  fontWeight: isCurrent ? 'medium' : 'normal',
                  fontSize: '0.875rem'
                }}
                aria-current={isCurrent ? 'page' : undefined}
              >
                {item.label}
              </Typography>
            );
          }

          return (
            <NextLink key={index} href={item.href} passHref legacyBehavior>
              <Link
                underline="hover"
                color="inherit"
                sx={{
                  fontSize: '0.875rem',
                  '&:hover': {
                    color: theme.palette.primary.main
                  }
                }}
              >
                {item.label}
              </Link>
            </NextLink>
          );
        })}
      </MUIBreadcrumbs>
    </Box>
  );
}