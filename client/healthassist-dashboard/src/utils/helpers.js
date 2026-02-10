// ✅ Convert a stats object into a chart-friendly array
// Example input: { English: "60%", Hindi: "40%" }
// Output: [{ name: "English", value: 60 }, { name: "Hindi", value: 40 }]
export const formatData = (statsObj) => {
  if (!statsObj || Object.keys(statsObj).length === 0) return [];

  // Compute total of all values to calculate relative percentages
  const total = Object.values(statsObj).reduce((sum, val) => {
    if (typeof val === "string" && val.includes("%")) {
      // Convert string percentages to numbers
      return sum + parseFloat(val.replace("%", ""));
    } else if (typeof val === "number") {
      return sum + val;
    }
    return sum;
  }, 0);

  // Map object to array of { name, value } relative to total
  return Object.entries(statsObj).map(([name, val]) => {
    let value = 0;
    if (typeof val === "string" && val.includes("%")) {
      value = parseFloat(val.replace("%", "")) || 0;
    } else if (typeof val === "number") {
      value = val;
    }
    // Return value as percentage of total for proper pie chart display
    return { name, value: (value / total) * 100 };
  });
};

// 🧩 Get the top category from a stats object
// Returns [categoryName, value] or ["N/A", "0%"] if empty
export const getTop = (statsObj) => {
  if (!statsObj || Object.keys(statsObj).length === 0) return ["N/A", "0%"];
  // Sort entries by value descending
  const sorted = Object.entries(statsObj).sort(
    (a, b) => parseFloat(b[1]) - parseFloat(a[1])
  );
  return sorted[0];
};

// 🎨 Predefined colors for charts, cycles through if more slices than colors
export const COLORS = ["#6366f1", "#f97316", "#10b981", "#ef4444", "#8b5cf6"];
