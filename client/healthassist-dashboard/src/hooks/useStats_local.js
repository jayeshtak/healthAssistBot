import { useState, useEffect } from "react";
import axios from "axios";

/**
 * ✅ Custom React hook to fetch HealthAssist dashboard statistics
 * Handles loading state, API call, and stores the response
 */
export default function useStats() {
  // State to hold fetched statistics
  const [stats, setStats] = useState(null);

  // State to indicate loading status
  const [loading, setLoading] = useState(true);

  /**
   * 🔹 Fetch stats from backend
   * Uses Axios to call /stats/advanced
   * Dynamically reads the backend port from Vite environment variables
   */
  const fetchStats = async () => {
    try {
      setLoading(true);

      // Read backend port from Vite environment variable or fallback to 5082
      const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || 5082;

      // Axios GET request to backend stats endpoint
      const res = await axios.get(
        `http://localhost:${BACKEND_PORT}/stats/advanced`
      );

      // Store response data in state
      setStats(res.data);
    } catch (err) {
      console.error("❌ Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats when the hook mounts
  useEffect(() => {
    fetchStats();
  }, []);

  // Return stats data, loading state, and refresh function
  return {
    stats,
    loading,
    fetchStats,
  };
}
