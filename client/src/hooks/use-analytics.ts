import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useCallback } from "react";

// Types for analytics events
export interface AnalyticsEvent {
  eventType: string;
  eventData?: Record<string, any>;
  sessionId: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface FeedbackData {
  friendId?: string;
  recommendationData: {
    giftName: string;
    price: string;
    matchPercentage: number;
    generationParams: {
      budget: number;
      currency: string;
      personalityTraits: string[];
      interests: string[];
    };
  };
  rating: number; // -1 for thumbs down, 1 for thumbs up, or 1-5 star rating
  feedback?: string;
  helpful?: boolean;
  purchased?: boolean;
}

export interface PerformanceMetric {
  operation: string;
  responseTime: number;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

// Generate or retrieve session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('giftgenie-session-id');
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('giftgenie-session-id', sessionId);
  }
  return sessionId;
}

// Base analytics API calls
async function sendAnalyticsEvent(event: AnalyticsEvent) {
  const response = await fetch('/api/analytics/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    throw new Error('Failed to send analytics event');
  }

  return response.json();
}

async function sendFeedback(feedback: FeedbackData) {
  const response = await fetch('/api/analytics/feedback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(feedback),
  });

  if (!response.ok) {
    throw new Error('Failed to send feedback');
  }

  return response.json();
}

async function sendPerformanceMetric(metric: PerformanceMetric) {
  const response = await fetch('/api/analytics/performance', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metric),
  });

  if (!response.ok) {
    throw new Error('Failed to send performance metric');
  }

  return response.json();
}

// Main analytics hook
export function useAnalytics() {
  const sessionId = getSessionId();

  const eventMutation = useMutation({
    mutationFn: sendAnalyticsEvent,
    onError: (error) => {
      console.warn('Analytics event failed:', error);
    },
  });

  const feedbackMutation = useMutation({
    mutationFn: sendFeedback,
    onError: (error) => {
      console.warn('Feedback submission failed:', error);
    },
  });

  const performanceMutation = useMutation({
    mutationFn: sendPerformanceMetric,
    onError: (error) => {
      console.warn('Performance metric failed:', error);
    },
  });

  const trackEvent = useCallback((eventType: string, eventData?: Record<string, any>) => {
    const event: AnalyticsEvent = {
      eventType,
      eventData,
      sessionId,
      userAgent: navigator.userAgent,
    };
    console.log('[trackEvent] Sending analytics event:', event); // Debug log
    eventMutation.mutate(event);
  }, [sessionId, eventMutation]);

  const trackPageView = useCallback((page: string, additionalData?: Record<string, any>) => {
    trackEvent('page_view', {
      page,
      timestamp: new Date().toISOString(),
      ...additionalData,
    });
  }, [trackEvent]);

  const trackClick = useCallback((element: string, additionalData?: Record<string, any>) => {
    trackEvent('click', {
      element,
      timestamp: new Date().toISOString(),
      ...additionalData,
    });
  }, [trackEvent]);

  const trackGiftGeneration = useCallback((friendData: any, budget: number, currency: string) => {
    trackEvent('generate_gifts', {
      friendId: friendData.id,
      budget,
      currency,
      personalityTraits: friendData.personalityTraits,
      interests: friendData.interests,
      timestamp: new Date().toISOString(),
    });
  }, [trackEvent]);

  const trackGiftSave = useCallback((giftData: any, friendId: string) => {
    trackEvent('save_gift', {
      giftName: giftData.name,
      giftPrice: giftData.price,
      friendId,
      timestamp: new Date().toISOString(),
    });
  }, [trackEvent]);

  const submitFeedback = useCallback((feedback: FeedbackData) => {
    feedbackMutation.mutate(feedback);
  }, [feedbackMutation]);

  const trackPerformance = useCallback((metric: PerformanceMetric) => {
    performanceMutation.mutate(metric);
  }, [performanceMutation]);

  return {
    trackEvent,
    trackPageView,
    trackClick,
    trackGiftGeneration,
    trackGiftSave,
    submitFeedback,
    trackPerformance,
    isLoading: eventMutation.isPending || feedbackMutation.isPending || performanceMutation.isPending,
  };
}

// Hook for automatic page view tracking
export function usePageTracking(pageName: string, dependencies: any[] = []) {
  const { trackPageView } = useAnalytics();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current) {
      trackPageView(pageName);
      hasTracked.current = true;
    }
  }, [trackPageView, pageName, ...dependencies]);
}

// Hook for tracking performance of operations
export function usePerformanceTracking() {
  const { trackPerformance } = useAnalytics();

  const trackOperation = useCallback(async <T>(
    operation: string,
    asyncFunction: () => Promise<T>,
    metadata?: Record<string, any>
  ): Promise<T> => {
    const startTime = performance.now();
    
    try {
      const result = await asyncFunction();
      const endTime = performance.now();
      
      trackPerformance({
        operation,
        responseTime: Math.round(endTime - startTime),
        success: true,
        metadata,
      });
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      
      trackPerformance({
        operation,
        responseTime: Math.round(endTime - startTime),
        success: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        metadata,
      });
      
      throw error;
    }
  }, [trackPerformance]);

  return { trackOperation };
}

// Hook for tracking user engagement
export function useEngagementTracking() {
  const { trackEvent } = useAnalytics();

  const trackBudgetChange = useCallback((oldBudget: number, newBudget: number, currency: string) => {
    trackEvent('budget_change', {
      oldBudget,
      newBudget,
      currency,
      timestamp: new Date().toISOString(),
    });
  }, [trackEvent]);

  const trackTabSwitch = useCallback((fromTab: string, toTab: string) => {
    trackEvent('tab_switch', {
      fromTab,
      toTab,
      timestamp: new Date().toISOString(),
    });
  }, [trackEvent]);

  const trackFriendSelect = useCallback((friendId: string, friendName: string) => {
    trackEvent('friend_select', {
      friendId,
      friendName,
      timestamp: new Date().toISOString(),
    });
  }, [trackEvent]);

  const trackFeatureUsage = useCallback((feature: string, context?: Record<string, any>) => {
    trackEvent('feature_usage', {
      feature,
      context,
      timestamp: new Date().toISOString(),
    });
  }, [trackEvent]);

  return {
    trackBudgetChange,
    trackTabSwitch,
    trackFriendSelect,
    trackFeatureUsage,
  };
}