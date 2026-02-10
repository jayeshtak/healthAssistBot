/**
 * 🔹 Navbar component for HealthAssist Dashboard
 * @param {boolean} darkMode - current theme mode
 * @param {function} setDarkMode - function to toggle dark/light mode
 * @param {function} onRefresh - function to refresh dashboard stats
 *
 * Renders the main navigation bar with:
 * - Dashboard title/logo
 * - Refresh button
 * - Dark/Light mode toggle button
 */
export default function Navbar({ darkMode, setDarkMode, onRefresh }) {
  return (
    <nav
      className={`
        w-full                 /* full width navbar */
        px-8 py-4             /* horizontal and vertical padding */
        flex justify-between items-center   /* flex layout: space between title and buttons */
        shadow-lg             /* subtle shadow under navbar */
        transition-colors duration-300    /* smooth color transitions for dark/light mode */
        ${
          darkMode ? "bg-gray-900 text-gray-100" : "bg-white text-gray-800"
        } /* background & text color based on mode */
      `}>
      {/* Dashboard title/logo */}
      <h1 className="text-2xl md:text-3xl font-bold text-indigo-500 flex items-center gap-2">
        🩺 HealthAssist Dashboard
      </h1>

      {/* Buttons container */}
      <div className="flex gap-3 md:gap-4 items-center">
        {/* Refresh button */}
        <button
          onClick={onRefresh}
          className="
            px-4 py-2 
            bg-indigo-600 text-white 
            rounded-lg 
            hover:bg-indigo-700 
            transition 
            shadow
          ">
          🔄 Refresh
        </button>

        {/* Dark/Light mode toggle button */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className={`
            px-3 py-2 rounded-lg border transition
            ${
              darkMode
                ? "bg-yellow-400 text-black border-yellow-500 hover:bg-yellow-300"
                : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
            }
          `}>
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>
    </nav>
  );
}
