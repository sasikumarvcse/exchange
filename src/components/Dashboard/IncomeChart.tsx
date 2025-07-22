import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface IncomeChartProps {
  data: Array<{
    date: string;
    directIncome: number;
    royaltyIncome: number;
  }>;
}

const IncomeChart: React.FC<IncomeChartProps> = ({ data }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Income Overview</h3>
      </div>
      
      <div className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="directIncome" 
              stroke="#1F3A93" 
              strokeWidth={2}
              name="Direct Income"
            />
            <Line 
              type="monotone" 
              dataKey="royaltyIncome" 
              stroke="#E74C3C" 
              strokeWidth={2}
              name="Royalty Income"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default IncomeChart;