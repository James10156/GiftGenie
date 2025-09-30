import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

interface AnalyticsData {
  userAnalytics: any[];
  recommendationFeedback: any[];
  performanceMetrics: any[];
}

interface AnalyticsDashboardProps {
  currentUser: any;
}

export function AnalyticsDashboard({ currentUser }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState("7d");

  // Fetch analytics data
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ["analytics", timeRange],
    queryFn: async () => {
      const responses = await Promise.allSettled([
        fetch(`/api/analytics/events?limit=100`, { credentials: "include" }),
        fetch(`/api/analytics/feedback?limit=50`, { credentials: "include" }),
        fetch(`/api/analytics/performance?limit=100`, { credentials: "include" }),
      ]);

      const eventsData = responses[0].status === "fulfilled" && responses[0].value.ok ? await responses[0].value.json() : [];
      const feedbackData = responses[1].status === "fulfilled" && responses[1].value.ok ? await responses[1].value.json() : [];
      const performanceData = responses[2].status === "fulfilled" && responses[2].value.ok ? await responses[2].value.json() : [];

      return {
        userAnalytics: eventsData,
        recommendationFeedback: feedbackData,
        performanceMetrics: performanceData,
      };
    },
    enabled: !!currentUser,
  });

  if (!currentUser) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="text-center py-8">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium mb-2">Analytics Dashboard</h3>
          <p className="text-gray-600 mb-4">Sign in to view your usage analytics and insights</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="text-center py-8">
          <div className="animate-spin text-4xl mb-4">📊</div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  const userAnalytics = analytics?.userAnalytics || [];
  const feedbackData = analytics?.recommendationFeedback || [];
  const performanceData = analytics?.performanceMetrics || [];

  // Calculate insights
  const totalEvents = userAnalytics.length;
  const positiveRatings = feedbackData.filter((f: any) => f.rating === 1).length;
  const negativeRatings = feedbackData.filter((f: any) => f.rating === -1).length;
  const avgResponseTime = performanceData.length > 0 
    ? Math.round(performanceData.reduce((sum: number, p: any) => sum + p.responseTime, 0) / performanceData.length)
    : 0;
  const successRate = performanceData.length > 0
    ? Math.round((performanceData.filter((p: any) => p.success).length / performanceData.length) * 100)
    : 0;

  // Event type counts
  const eventCounts = userAnalytics.reduce((acc: Record<string, number>, event: any) => {
    acc[event.eventType] = (acc[event.eventType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Budget changes over time
  const budgetChanges = userAnalytics
    .filter((event: any) => event.eventType === 'budget_change')
    .map((event: any) => event.eventData)
    .slice(-10);

  // Always show performance metrics section, even if other analytics fail
  const showPerformanceSection = performanceData.length > 0;

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">📊 Analytics Dashboard</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Total Interactions</p>
              <p className="text-2xl font-bold text-blue-800">{totalEvents}</p>
            </div>
            <div className="text-blue-500 text-2xl">🎯</div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Positive Feedback</p>
              <p className="text-2xl font-bold text-green-800">{positiveRatings}</p>
              <p className="text-xs text-green-600">
                {positiveRatings + negativeRatings > 0 
                  ? `${Math.round((positiveRatings / (positiveRatings + negativeRatings)) * 100)}% positive` 
                  : 'No ratings yet'}
              </p>
            </div>
            <div className="text-green-500 text-2xl">👍</div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Avg Response Time</p>
              <p className="text-2xl font-bold text-purple-800">{avgResponseTime}ms</p>
            </div>
            <div className="text-purple-500 text-2xl">⚡</div>
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Success Rate</p>
              <p className="text-2xl font-bold text-orange-800">{successRate}%</p>
            </div>
            <div className="text-orange-500 text-2xl">✅</div>
          </div>
        </div>
      </div>

      {/* Activity Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">📈 Activity Breakdown</h3>
          <div className="space-y-2">
            {Object.entries(eventCounts).map(([eventType, count]) => {
              const countNum = count as number;
              return (
                <div key={eventType} className="flex justify-between items-center">
                  <span className="text-sm capitalize">{eventType.replace('_', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <div className="bg-blue-200 h-2 rounded-full" style={{ width: `${(countNum / Math.max(...Object.values(eventCounts).map(v => v as number))) * 100}px` }}></div>
                    <span className="text-sm font-medium">{countNum}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">💰 Budget Preferences</h3>
          {budgetChanges.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Recent budget adjustments:</p>
              {(budgetChanges as any[]).slice(-5).map((change: any, index: number) => (
                <div key={index} className="text-sm">
                  <span className="text-gray-500">{change?.currency} </span>
                  <span className={change?.oldBudget < change?.newBudget ? 'text-green-600' : 'text-red-600'}>
                    {change?.oldBudget} → {change?.newBudget}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No budget changes recorded</p>
          )}
        </div>
      </div>

      {/* Feedback Analysis */}
      {feedbackData.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-3">💭 Recommendation Feedback</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Rating Distribution</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm">👍 Positive:</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${positiveRatings > 0 ? (positiveRatings / (positiveRatings + negativeRatings)) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{positiveRatings}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">👎 Negative:</span>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-red-500 h-2 rounded-full" 
                      style={{ width: `${negativeRatings > 0 ? (negativeRatings / (positiveRatings + negativeRatings)) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{negativeRatings}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Feedback</h4>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {(feedbackData as any[]).slice(-3).map((feedback: any, index: number) => (
                  <div key={index} className="text-xs text-gray-600">
                    <span className={feedback.rating === 1 ? 'text-green-600' : 'text-red-600'}>
                      {feedback.rating === 1 ? '👍' : '👎'}
                    </span>
                    <span className="ml-1">{feedback.recommendationData?.giftName}</span>
                    {feedback.feedback && (
                      <span className="ml-1 italic">- "{feedback.feedback.slice(0, 30)}..."</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Recommendation Performance */}
      {performanceData.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200 mb-6">
          <h3 className="font-semibold mb-4 text-purple-800">🤖 Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(() => {
              const successful = performanceData.filter((p: any) => p.success);
              const failed = performanceData.filter((p: any) => !p.success);
              const avgResponseTime = successful.length > 0
                ? Math.round(successful.reduce((sum: number, p: any) => sum + p.responseTime, 0) / successful.length)
                : 0;
              const successRate = performanceData.length > 0
                ? Math.round((successful.length / performanceData.length) * 100)
                : 0;
              const totalRequests = performanceData.length;
              return (
                <>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-purple-700 mb-3">📊 Performance Stats</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Avg Response Time:</span>
                        <span className="text-sm font-medium">{avgResponseTime}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Success Rate:</span>
                        <span className="text-sm font-medium text-green-600">{successRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-600">Total Requests:</span>
                        <span className="text-sm font-medium">{totalRequests}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-purple-700 mb-3">⚠️ Recent Issues</h4>
                    <div className="space-y-2">
                      {failed.slice(-3).length > 0 ? (
                        failed.slice(-3).map((error: any, index: number) => (
                          <div key={index} className="text-xs">
                            <div className="flex justify-between">
                              <span className="text-red-600 font-medium">Error:</span>
                              <span className="text-gray-500">{error.responseTime}ms</span>
                            </div>
                            <p className="text-red-600 mt-1">{error.errorMessage?.slice(0, 50)}...</p>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-green-600">No recent failures! 🎉</p>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* AI Performance vs User Satisfaction Correlation */}
      {performanceData.filter((p: any) => p.operation === 'ai_recommendation').length > 0 && feedbackData.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-lg border border-green-200 mb-6">
          <h3 className="font-semibold mb-4 text-green-800">📈 Performance vs Satisfaction Analysis</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(() => {
              const aiMetrics = performanceData.filter((p: any) => p.operation === 'ai_recommendation');
              const successfulAI = aiMetrics.filter((p: any) => p.success);
              
              // Correlate performance with feedback (simplified correlation by timestamp proximity)
              const performanceWithFeedback = successfulAI.map((metric: any) => {
                // Find feedback within 5 minutes of the AI recommendation
                const relatedFeedback = feedbackData.find((feedback: any) => {
                  const metricTime = new Date(metric.timestamp).getTime();
                  const feedbackTime = new Date(feedback.timestamp).getTime();
                  return Math.abs(metricTime - feedbackTime) < 5 * 60 * 1000; // 5 minutes
                });
                return {
                  ...metric,
                  userRating: relatedFeedback?.rating,
                  userFeedback: relatedFeedback?.feedback
                };
              }).filter((m: any) => m.userRating !== undefined);
              
              // Performance buckets
              const fastRequests = performanceWithFeedback.filter((p: any) => p.responseTime < 2000);
              const mediumRequests = performanceWithFeedback.filter((p: any) => p.responseTime >= 2000 && p.responseTime < 5000);
              const slowRequests = performanceWithFeedback.filter((p: any) => p.responseTime >= 5000);
              
              // Satisfaction rates by performance
              const fastSatisfaction = fastRequests.length > 0 
                ? Math.round((fastRequests.filter((p: any) => p.userRating === 1).length / fastRequests.length) * 100) 
                : 0;
              const mediumSatisfaction = mediumRequests.length > 0 
                ? Math.round((mediumRequests.filter((p: any) => p.userRating === 1).length / mediumRequests.length) * 100) 
                : 0;
              const slowSatisfaction = slowRequests.length > 0 
                ? Math.round((slowRequests.filter((p: any) => p.userRating === 1).length / slowRequests.length) * 100) 
                : 0;
                
              return (
                <>
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-green-700 mb-3">⚡ Response Time vs Satisfaction</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Fast (&lt;2s)</span>
                          <span>{fastSatisfaction}% satisfied ({fastRequests.length} samples)</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${fastSatisfaction}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Medium (2-5s)</span>
                          <span>{mediumSatisfaction}% satisfied ({mediumRequests.length} samples)</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-yellow-500 h-2 rounded-full" 
                            style={{ width: `${mediumSatisfaction}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Slow (&gt;5s)</span>
                          <span>{slowSatisfaction}% satisfied ({slowRequests.length} samples)</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full" 
                            style={{ width: `${slowSatisfaction}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-green-700 mb-3">💡 Insights & Recommendations</h4>
                    <div className="space-y-2 text-xs">
                      {performanceWithFeedback.length === 0 ? (
                        <p className="text-gray-500">Need more correlated data for insights</p>
                      ) : (
                        <>
                          {fastSatisfaction > mediumSatisfaction + 10 && (
                            <div className="flex items-start gap-2 text-green-700">
                              <span>✅</span>
                              <span>Fast responses (&lt;2s) show {fastSatisfaction - mediumSatisfaction}% higher satisfaction</span>
                            </div>
                          )}
                          {slowSatisfaction < 70 && slowRequests.length > 0 && (
                            <div className="flex items-start gap-2 text-orange-600">
                              <span>⚠️</span>
                              <span>Slow responses (&gt;5s) have {100 - slowSatisfaction}% dissatisfaction rate</span>
                            </div>
                          )}
                          {aiMetrics.filter((m: any) => !m.success).length > 0 && (
                            <div className="flex items-start gap-2 text-red-600">
                              <span>🚨</span>
                              <span>{aiMetrics.filter((m: any) => !m.success).length} failed AI requests need attention</span>
                            </div>
                          )}
                          {performanceWithFeedback.length > 10 && (
                            <div className="flex items-start gap-2 text-blue-600">
                              <span>📊</span>
                              <span>Strong data correlation: {performanceWithFeedback.length} matched performance-feedback pairs</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Performance Insights */}
      {performanceData.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">⚡ Performance Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Operation Times</h4>
              <div className="space-y-1">
                {Object.entries(
                  (performanceData as any[]).reduce((acc: Record<string, number[]>, p: any) => {
                    if (!acc[p.operation]) acc[p.operation] = [];
                    acc[p.operation].push(p.responseTime);
                    return acc;
                  }, {} as Record<string, number[]>)
                ).map(([operation, times]) => {
                  const timesArray = times as number[];
                  return (
                    <div key={operation} className="text-xs">
                      <span className="font-medium">{operation}:</span>
                      <span className="ml-1">{Math.round(timesArray.reduce((a: number, b: number) => a + b, 0) / timesArray.length)}ms avg</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Success Rate by Operation</h4>
              <div className="space-y-1">
                {Object.entries(
                  (performanceData as any[]).reduce((acc: Record<string, { success: number, total: number }>, p: any) => {
                    if (!acc[p.operation]) acc[p.operation] = { success: 0, total: 0 };
                    acc[p.operation].total++;
                    if (p.success) acc[p.operation].success++;
                    return acc;
                  }, {} as Record<string, { success: number, total: number }>)
                ).map(([operation, stats]) => {
                  const statsObj = stats as { success: number, total: number };
                  return (
                    <div key={operation} className="text-xs">
                      <span className="font-medium">{operation}:</span>
                      <span className="ml-1">{Math.round((statsObj.success / statsObj.total) * 100)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Errors</h4>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {(performanceData as any[])
                  .filter((p: any) => !p.success)
                  .slice(-3)
                  .map((error: any, index: number) => (
                    <div key={index} className="text-xs text-red-600">
                      <span className="font-medium">{error.operation}:</span>
                      <span className="ml-1">{error.errorMessage?.slice(0, 30)}...</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}