import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export default function StatsCard({ title, value, subtitle, icon, iconBgColor, iconColor, trend }) {
  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 h-full">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-gray-500 mb-2 truncate">{title}</p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 break-words leading-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500 mt-1 truncate">{subtitle}</p>
            )}
          </div>
          <div className={`p-2.5 sm:p-3 rounded-xl ${iconBgColor || 'bg-gray-100'} ${iconColor || 'text-gray-600'} flex-shrink-0`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}