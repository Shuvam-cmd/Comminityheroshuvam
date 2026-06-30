import React from "react";
import { IIssue, IStats } from "../types";
import { AlertTriangle, Clock, CheckCircle2, LayoutGrid, Building2, BarChart3 } from "lucide-react";

interface DashboardStatsProps {
  issues: IIssue[];
}

export default function DashboardStats({ issues }: DashboardStatsProps) {
  // Compute real-time statistics
  const stats: IStats = {
    total: issues.length,
    pending: issues.filter((i) => i.status === "Pending").length,
    inProgress: issues.filter((i) => i.status === "In Progress").length,
    resolved: issues.filter((i) => i.status === "Resolved").length,
    categoryDistribution: {},
    departmentDistribution: {}
  };

  issues.forEach((issue) => {
    // Category distribution
    stats.categoryDistribution[issue.category] = (stats.categoryDistribution[issue.category] || 0) + 1;
    // Department distribution
    stats.departmentDistribution[issue.department] = (stats.departmentDistribution[issue.department] || 0) + 1;
  });

  // Category listing options with corresponding colors
  const categoryColors: { [key: string]: string } = {
    "Roads & Potholes": "#F59E0B", // Accent/Amber
    "Streetlights & Electricity": "#3B82F6", // Info/Blue
    "Water Leakage & Sewage": "#2E7D32", // Primary Green
    "Garbage & Sanitation": "#10B981", // Resolved Emerald
    "Public Parks & Trees": "#1B5E20", // Dark Primary Green
    "Vandalism & Safety": "#EF4444", // Error Red
    "Other": "#6B7280" // Secondary Gray
  };

  const totalCategoriesCount = Object.values(stats.categoryDistribution).reduce((a, b) => a + b, 0) || 1;
  const totalDepartmentsCount = Object.values(stats.departmentDistribution).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Bento Grid Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Issues Card */}
        <div className="bg-white rounded-2xl p-5 border border-natural-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-natural-badge uppercase tracking-wider mb-1">
              Total Reported
            </p>
            <p className="text-3xl font-serif font-bold text-natural-text">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-natural-light/20 flex items-center justify-center text-natural-primary">
            <LayoutGrid className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Card */}
        <div className="bg-white rounded-2xl p-5 border border-natural-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-natural-accent uppercase tracking-wider mb-1">
              Pending Action
            </p>
            <p className="text-3xl font-serif font-bold text-natural-accent">{stats.pending}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-natural-accent/10 flex items-center justify-center text-natural-accent">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* In Progress Card */}
        <div className="bg-white rounded-2xl p-5 border border-natural-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-natural-primary uppercase tracking-wider mb-1">
              In Progress
            </p>
            <p className="text-3xl font-serif font-bold text-natural-primary">{stats.inProgress}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-natural-primary/10 flex items-center justify-center text-natural-primary">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Resolved Card */}
        <div className="bg-white rounded-2xl p-5 border border-natural-border shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
              Issues Resolved
            </p>
            <p className="text-3xl font-serif font-bold text-emerald-700">{stats.resolved}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Category Analytics Card */}
        <div className="bg-white rounded-2xl p-6 border border-natural-border shadow-xs">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-4 h-4 text-natural-accent" />
            <h3 className="font-serif font-bold text-lg">Category Distribution</h3>
          </div>

          {Object.keys(categoryColors).map((category) => {
            const count = stats.categoryDistribution[category] || 0;
            const percentage = Math.round((count / totalCategoriesCount) * 100) || 0;
            const barColor = categoryColors[category];

            return (
              <div key={category} className="mb-4 last:mb-0">
                <div className="flex justify-between text-xs font-semibold text-natural-text mb-1">
                  <span>{category}</span>
                  <span className="text-natural-badge">
                    {count} reports ({percentage}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-natural-bg rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: barColor
                    }}
                  />
                </div>
              </div>
            );
          })}
          {issues.length === 0 && (
            <div className="py-12 text-center text-xs text-natural-light font-medium">
              No issues reported yet to calculate analytics.
            </div>
          )}
        </div>

        {/* Department Analytics Card */}
        <div className="bg-white rounded-2xl p-6 border border-natural-border shadow-xs">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="w-4 h-4 text-natural-primary" />
            <h3 className="font-serif font-bold text-lg">Responsible Departments</h3>
          </div>

          <div className="space-y-4">
            {Object.keys(stats.departmentDistribution).length > 0 ? (
              Object.entries(stats.departmentDistribution)
                .sort((a, b) => b[1] - a[1])
                .map(([department, count]) => {
                  const percentage = Math.round((count / totalDepartmentsCount) * 100) || 0;
                  return (
                    <div
                      key={department}
                      className="flex items-center justify-between p-3.5 bg-natural-bg/50 rounded-xl border border-natural-border/50 hover:bg-natural-bg transition-colors"
                    >
                      <div>
                        <p className="text-xs font-bold text-natural-text leading-tight">{department}</p>
                        <p className="text-[10px] text-natural-badge mt-0.5 uppercase tracking-wide">
                          {percentage}% load share
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-serif font-bold text-natural-primary">{count}</span>
                        <span className="text-[10px] bg-natural-light/30 px-1.5 py-0.5 rounded text-natural-primary font-bold">
                          REPORTS
                        </span>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="py-12 text-center text-xs text-natural-light font-medium">
                No department metrics available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
