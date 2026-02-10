/**
 * 🔹 StatsChart component
 * Displays a responsive Pie Chart for language, intent, or WhatsApp stats.
 *
 * @param {string} title - The chart title (e.g., "Language Distribution")
 * @param {object} data - Stats object, e.g., { English: 25, Hindi: 25 }
 * @param {boolean} darkMode - Whether dark mode is enabled
 *
 * Uses Recharts for rendering charts.
 */

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatData, COLORS } from "../utils/helpers";

export default function StatsChart({ title, data, darkMode }) {
  return (
    <div
      className={`
        rounded-2xl        /* rounded corners */
        shadow-lg          /* subtle shadow */
        p-6                /* padding */
        transition-colors duration-300 /* smooth theme color transition */
        ${
          darkMode
            ? "bg-gray-800 hover:bg-gray-700"
            : "bg-white hover:bg-gray-50"
        }
      `}>
      {/* Chart title */}
      <h2 className="text-xl md:text-2xl font-semibold mb-4 flex items-center gap-2">
        {title}
      </h2>

      {/* Chart rendering */}
      {data && Object.keys(data).length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            {/* Pie slice data */}
            <Pie
              data={formatData(data)} // format data to [{name, value}]
              dataKey="value"
              nameKey="name"
              outerRadius={100}
              label>
              {/* Slice colors */}
              {formatData(data).map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>

            {/* Tooltip styling */}
            <Tooltip
              contentStyle={{
                backgroundColor: darkMode ? "#1f2937" : "#fff",
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
              }}
              itemStyle={{ color: darkMode ? "#fff" : "#000" }}
            />

            {/* Legend styling */}
            <Legend
              wrapperStyle={{
                color: darkMode ? "#fff" : "#000",
                fontSize: "14px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      ) : (
        // Fallback for empty data
        <p className="text-gray-400 text-center mt-20">No data available</p>
      )}
    </div>
  );
}
