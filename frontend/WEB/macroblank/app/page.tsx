'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts';
import { Info } from 'lucide-react';

const requestData = [
  { name: 'UTC-8', value: 3 },
  { name: 'Dec 25', value: 3 },
  { name: 'Jan 1', value: 3 },
  { name: 'Jan 8', value: 3 },
  { name: 'Jan 15', value: 3 },
  { name: 'Now', value: 3 },
];

const errorData = [
  { name: 'UTC-8', value: 0 },
  { name: 'Dec 25', value: 0 },
  { name: 'Jan 1', value: 0 },
  { name: 'Jan 8', value: 0 },
  { name: 'Jan 15', value: 3 },
];

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard Overview</h1>
        </div>
      </div>

      {/* Overview Charts */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-2">
            <h2 className="text-sm font-medium text-white">Overview</h2>
            <Info className="w-4 h-4 text-gray-500" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Requests Chart */}
            <div className="bg-[var(--card-bg)] p-6 rounded-lg border border-[var(--sidebar-border)] min-h-[300px]">
                <h3 className="text-sm text-gray-400 mb-4">Total API Requests</h3>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={requestData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 11}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 11}} />
                            <Tooltip contentStyle={{backgroundColor: '#2D2D2F', border: 'none'}} />
                            <Line type="monotone" dataKey="value" stroke="var(--success)" strokeWidth={2} dot={false} activeDot={{r: 4, fill: '#1E1E20', stroke: 'var(--success)'}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded bg-[var(--success)]"></span>
                        <span className="text-gray-400">Requests</span>
                    </div>
                </div>
            </div>

            {/* Errors Chart */}
            <div className="bg-[var(--card-bg)] p-6 rounded-lg border border-[var(--sidebar-border)] min-h-[300px]">
                <h3 className="text-sm text-gray-400 mb-4">Total API Errors</h3>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={errorData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 11}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#888', fontSize: 11}} />
                            <Tooltip contentStyle={{backgroundColor: '#2D2D2F', border: 'none'}} />
                            <Bar dataKey="value" fill="#4285F4" barSize={6} radius={[2, 2, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex items-center gap-4 mt-4 text-xs">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#4285F4]"></span>
                        <span className="text-gray-400">429 TooManyRequests</span>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Model Stats Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[var(--card-bg)] p-6 rounded-lg border border-[var(--sidebar-border)] min-h-[300px] flex flex-col">
             <div className="flex items-center gap-2 mb-8">
                <h3 className="text-sm font-medium text-gray-400">Generate content & Live API</h3>
                <Info className="w-3 h-3 text-gray-500" />
            </div>
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm italic">
                No data available
            </div>
        </div>
        <div className="bg-[var(--card-bg)] p-6 rounded-lg border border-[var(--sidebar-border)] min-h-[300px] flex flex-col">
             <div className="flex items-center gap-2 mb-8">
                <h3 className="text-sm font-medium text-gray-400">Requests per model</h3>
            </div>
            <div className="flex-1 flex items-center justify-center text-gray-500 text-sm italic">
                No data available
            </div>
        </div>
      </div>
    </div>
  );
}