'use client';

import React from 'react';

/**
 * Performance monitoring utilities for tracking component render times
 * and identifying performance bottlenecks
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private static metrics = new Map<string, PerformanceMetric>();
  private static enabled = process.env.NODE_ENV === 'development';

  /**
   * Start measuring performance for a given operation
   */
  static start(name: string): void {
    if (!this.enabled) return;

    this.metrics.set(name, {
      name,
      startTime: performance.now(),
    });
  }

  /**
   * End measuring performance for a given operation
   */
  static end(name: string): number | null {
    if (!this.enabled) return null;

    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" was not started`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.duration = duration;

    // Log slow operations
    if (duration > 100) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * Measure the execution time of a function
   */
  static measure<T>(name: string, fn: () => T): T {
    if (!this.enabled) return fn();

    this.start(name);
    try {
      const result = fn();
      return result;
    } finally {
      this.end(name);
    }
  }

  /**
   * Measure the execution time of an async function
   */
  static async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.enabled) return fn();

    this.start(name);
    try {
      const result = await fn();
      return result;
    } finally {
      this.end(name);
    }
  }

  /**
   * Get all recorded metrics
   */
  static getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(m => m.duration !== undefined);
  }

  /**
   * Clear all metrics
   */
  static clear(): void {
    this.metrics.clear();
  }

  /**
   * Get average duration for operations with the same name
   */
  static getAverageDuration(name: string): number | null {
    const matchingMetrics = this.getMetrics().filter(m => m.name === name);
    if (matchingMetrics.length === 0) return null;

    const totalDuration = matchingMetrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    return totalDuration / matchingMetrics.length;
  }

  /**
   * Log performance summary
   */
  static logSummary(): void {
    if (!this.enabled) return;

    const metrics = this.getMetrics();
    if (metrics.length === 0) {
      console.log('No performance metrics recorded');
      return;
    }

    console.group('Performance Summary');
    
    // Group by operation name
    const groupedMetrics = metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      acc[metric.name].push(metric);
      return acc;
    }, {} as Record<string, PerformanceMetric[]>);

    Object.entries(groupedMetrics).forEach(([name, metrics]) => {
      const durations = metrics.map(m => m.duration!);
      const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);

      console.log(`${name}: avg=${avg.toFixed(2)}ms, min=${min.toFixed(2)}ms, max=${max.toFixed(2)}ms, count=${metrics.length}`);
    });

    console.groupEnd();
  }
}

/**
 * React hook for measuring component render performance
 */
export function usePerformanceMonitor(componentName: string) {
  if (process.env.NODE_ENV !== 'development') {
    return {
      startRender: () => {},
      endRender: () => {},
    };
  }

  const startRender = () => {
    PerformanceMonitor.start(`${componentName}-render`);
  };

  const endRender = () => {
    PerformanceMonitor.end(`${componentName}-render`);
  };

  return {
    startRender,
    endRender,
  };
}

/**
 * Higher-order component for automatic performance monitoring
 */
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const MonitoredComponent = React.memo((props: P) => {
    const { startRender, endRender } = usePerformanceMonitor(displayName);

    React.useEffect(() => {
      startRender();
      return () => {
        endRender();
      };
    });

    return React.createElement(WrappedComponent, props);
  });

  MonitoredComponent.displayName = `withPerformanceMonitoring(${displayName})`;

  return MonitoredComponent;
}

export default PerformanceMonitor;