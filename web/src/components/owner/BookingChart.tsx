'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

export type BookingChartData = {
  labels: string[];
  total: number[];
  confirmed: number[];
  pending: number[];
};

type Props = {
  data: BookingChartData | null;
  days?: number;
};

export function BookingChart({ data, days = 30 }: Props) {
  // Transform parallel arrays into recharts' row format
  const chartData =
    data && data.labels.length > 0
      ? data.labels.map((label, i) => ({
          label,
          total: data.total[i] ?? 0,
          confirmed: data.confirmed[i] ?? 0,
          pending: data.pending[i] ?? 0,
        }))
      : [];

  const hasAnyData = chartData.some(
    (d) => d.total > 0 || d.confirmed > 0 || d.pending > 0,
  );

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-10">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Booking Overview
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Bookings created over the last {days} days
          </p>
        </div>
      </div>

      {!hasAnyData ? (
        <div className="flex items-center justify-center h-64 text-sm text-gray-400">
          No booking activity in this period yet.
        </div>
      ) : (
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 16, left: -12, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f1f5f9"
                vertical={false}
              />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={{ stroke: '#e5e7eb' }}
                interval="preserveStartEnd"
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                  fontSize: 12,
                }}
                labelStyle={{ fontWeight: 600, color: '#111827' }}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="total"
                name="Total"
                stroke="#2563eb"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="confirmed"
                name="Confirmed"
                stroke="#16a34a"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="pending"
                name="Pending"
                stroke="#d97706"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}