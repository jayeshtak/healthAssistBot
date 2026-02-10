// Import React useState hook
import { useState } from "react";

// Import components
import Navbar from "./components/Navbar";
import SummaryCard from "./components/SummaryCard";
import StatsChart from "./components/StatsChart";
import Footer from "./components/Footer";

// Custom hook to fetch statistics from backend
import useStats from "./hooks/useStats";

// Helper functions for processing stats
import { getTop, formatData } from "./utils/helpers";

export default function App() {
  // State for theme toggling (dark/light)
  const [darkMode, setDarkMode] = useState(true);

  // Fetch stats from backend using custom hook
  const { stats, loading, fetchStats } = useStats();

  // Safety fallback for empty stats
  const languageStats = stats?.languageDistribution || {};
  const intentStats = stats?.intentDistribution || {};
  const totalConversations = stats?.totalMessages || 0;

  // Determine top language and top intent from stats
  const [topLang, topLangVal] = getTop(languageStats);
  const [topIntent, topIntentVal] = getTop(intentStats);

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-300 flex flex-col items-center ${
        darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-800"
      }`}>
      {/* Navbar at the top with refresh and theme toggle */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onRefresh={fetchStats}
      />

      {/* Main content area */}
      <main className="flex-1 w-full max-w-6xl px-6 md:px-8 mt-6 flex flex-col gap-8">
        {/* 📈 Summary Cards for overview stats */}
        <div className="grid md:grid-cols-3 gap-6">
          <SummaryCard
            title="Total Conversations"
            value={totalConversations}
            darkMode={darkMode}
          />
          <SummaryCard
            title="Top Language"
            value={topLang}
            subtitle={topLangVal} // e.g., "25%"
            darkMode={darkMode}
          />
          <SummaryCard
            title="Top Intent"
            value={topIntent}
            subtitle={topIntentVal} // e.g., "50%"
            darkMode={darkMode}
          />
        </div>

        {/* 📊 Charts */}
        {loading ? (
          // Show loading text while fetching stats
          <div className="text-center mt-20 text-gray-500">
            Loading stats...
          </div>
        ) : (
          // Display language & intent charts side by side
          <div className="grid md:grid-cols-2 gap-8">
            <StatsChart
              title="🌐 Language Distribution"
              data={languageStats}
              darkMode={darkMode}
            />
            <StatsChart
              title="🧠 Intent Distribution"
              data={intentStats}
              darkMode={darkMode}
            />
          </div>
        )}

        {/* Additional Stats Cards (Users & Last 24h messages) */}
        {!loading && stats && (
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <SummaryCard
              title="WhatsApp Users"
              value={stats.users.whatsapp}
              darkMode={darkMode}
            />
            <SummaryCard
              title="SMS Users"
              value={stats.users.sms}
              darkMode={darkMode}
            />
            <SummaryCard
              title="Chats Last 24h"
              value={stats.last24hMessages}
              darkMode={darkMode}
            />
          </div>
        )}

        {/* WhatsApp Voice vs Text + Average AI Response Time */}
        {!loading && stats && (
          <div className="grid md:grid-cols-2 gap-6 mt-8">
            <StatsChart
              title="🎤 WhatsApp Voice vs Text"
              data={stats.whatsappVoiceText}
              darkMode={darkMode}
            />
            <SummaryCard
              title="Avg AI Response Time"
              value={`${stats.avgResponseTimeMs} ms`}
              darkMode={darkMode}
            />
          </div>
        )}
      </main>

      {/* Footer at the bottom */}
      <Footer />
    </div>
  );
}
