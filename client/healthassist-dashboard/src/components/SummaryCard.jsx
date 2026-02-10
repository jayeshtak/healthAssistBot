/**
 * 🔹 SummaryCard component
 * Displays a statistic card with optional subtitle and adapts to dark/light mode.
 *
 * @param {string} title - The title of the card (e.g., "Total Conversations")
 * @param {string|number} value - Main numeric/statistical value to display
 * @param {string} [subtitle] - Optional smaller text below the main value
 * @param {boolean} darkMode - Whether dark mode is enabled
 */

export default function SummaryCard({ title, value, subtitle, darkMode }) {
  return (
    <div
      className={`
        rounded-2xl            /* rounded corners */
        shadow-md              /* subtle shadow */
        p-6                    /* padding */
        text-center            /* center-align content */
        transition-colors duration-300 /* smooth theme transition */
        ${
          darkMode
            ? "bg-gray-800 text-gray-100" /* dark mode colors */
            : "bg-white text-gray-800 border border-gray-200" /* light mode */
        }
      `}>
      {/* Card title */}
      <h3
        className={`
          text-sm font-semibold mb-2
          ${darkMode ? "text-gray-400" : "text-gray-500"}
        `}>
        {title}
      </h3>

      {/* Main value */}
      <p className="text-3xl font-bold text-indigo-500">{value}</p>

      {/* Optional subtitle */}
      {subtitle && (
        <p
          className={`
            mt-1 font-medium
            ${darkMode ? "text-indigo-400" : "text-indigo-600"}
          `}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
