import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

export default function DashboardCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = "blue",
  trend,
  alert = false
}) {
  const colorClasses = {
    blue: "from-blue-500 to-cyan-500",
    green: "from-green-500 to-emerald-500",
    red: "from-red-500 to-rose-500",
    orange: "from-orange-500 to-amber-500",
    purple: "from-purple-500 to-violet-500",
    indigo: "from-indigo-500 to-blue-500",
    gray: "from-gray-500 to-slate-500",
  };

  const bgClasses = {
    blue: "bg-blue-50",
    green: "bg-green-50",
    red: "bg-red-50",
    orange: "bg-orange-50",
    purple: "bg-purple-50",
    indigo: "bg-indigo-50",
    gray: "bg-gray-50",
  };

  return (
    <Card className={`shadow-lg hover:shadow-xl transition-all duration-300 border-t-4 ${
      alert ? 'border-t-red-500' : `border-t-${color}-500`
    }`}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1 truncate flex items-center gap-2">
              {title}
              {alert && <AlertTriangle className="w-4 h-4 text-red-500" />}
            </p>
          </div>
          <div className={`p-2 sm:p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex-shrink-0 ml-2`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
        </div>
        <div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{value}</p>
          <div className="flex items-center gap-2">
            <p className="text-xs sm:text-sm text-gray-600">{subtitle}</p>
            {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
            {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}