import React, { useEffect, useState, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useTheme } from '@mui/material/styles';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend);

const createGradient = (ctx, color) => {
  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, color + "99");
  gradient.addColorStop(1, color + "00");
  return gradient;
};

const getEnhancedChartOptions = (label, theme, unit = "") => ({
  responsive: true,
  maintainAspectRatio: false,
  animation: {
    duration: 1000,
    easing: "easeInOutQuad",
  },
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      backgroundColor: theme.palette.background.paper,
      titleColor: theme.palette.text.primary,
      bodyColor: theme.palette.text.secondary,
      cornerRadius: 6,
      callbacks: {
        label: (context) => `${label}: ${unit}${context.raw}`,
      },
    },
  },
  scales: {
    x: {
      ticks: { color: theme.palette.text.secondary },
      grid: { color: theme.palette.divider },
    },
    y: {
      ticks: {
        color: theme.palette.text.secondary,
        callback: (val) => unit + val,
      },
      grid: { color: theme.palette.divider },
    },
  },
  elements: {
    point: {
      radius: 5,
      hoverRadius: 7,
      backgroundColor: theme.palette.common.white,
      borderWidth: 2,
    },
    line: {
      borderWidth: 3,
      tension: 0.4,
      borderCapStyle: "round",
    },
  },
});

const Card = ({ title, value, color }) => {
    const theme = useTheme();
    return (
        <div
            style={{
                background: theme.palette.background.paper,
                padding: "20px",
                borderRadius: "16px",
                color: theme.palette.text.primary,
                width: "23%",
                transition: "transform 0.3s",
                border: `1px solid ${theme.palette.divider}`
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
            <div style={{ fontSize: "14px", color: theme.palette.text.primary }}>{title}</div>
            <div style={{ fontSize: "24px", fontWeight: "bold", color: theme.palette.secondary.dark, padding: "10px" }}>{value}</div>
        </div>
    );
}

const Badge = ({ text, bg, textColor }) => (
  <span
    style={{
      backgroundColor: bg,
      color: textColor,
      padding: '4px 10px',
      fontSize: '12px',
      fontWeight: 600,
      borderRadius: '999px',
      marginRight: '6px'
    }}
  >
    {text}
  </span>
);

const CognifuseDashboard = () => {
    const theme = useTheme();
  const [traces, setTraces] = useState([]);
  const [projectTabs, setProjectTabs] = useState([]);
  const [activeProject, setActiveProject] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTrace, setSelectedTrace] = useState(null);
  const chartRef = useRef(null);

  const username = "pk-lf-3efa16d2-1f43-4903-9cd9-3ad5287a1b7a";
  const password = "sk-lf-ca916005-248c-44cf-83e6-11f11fac8d34";
  const baseUrl = "http://10.10.20.156:3000/api/public/traces";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(baseUrl, {
          headers: {
            Authorization: "Basic " + btoa(username + ":" + password),
            "Content-Type": "application/json",
          },
        });
        const data = await res.json();
        const traceData = data.data || [];

        const projects = [
          ...new Set(traceData.map((trace) => trace.project?.name || "Unknown")),
        ];
        setProjectTabs(projects);
        setActiveProject(projects[0] || "");
        setTraces(traceData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredTraces = traces.filter(
    (t) =>
      (t.name?.toLowerCase() || "").includes(search.toLowerCase()) &&
      (t.project?.name || "Unknown") === activeProject
  );

  const totalCost = filteredTraces.reduce((sum, t) => sum + (t.totalCost || 0), 0);
  const avgLatency =
    filteredTraces.length > 0
      ? filteredTraces.reduce((sum, t) => sum + (t.latency || 0), 0) /
        filteredTraces.length
      : 0;

  const labels = filteredTraces.map((t) =>
    new Date(t.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  );

  const getChartData = (label, dataPoints, color) => {
    const ctx = chartRef.current?.ctx;
    const gradient = ctx ? createGradient(ctx, color) : color;

    return {
      labels,
      datasets: [
        {
          label,
          data: dataPoints,
          fill: true,
          backgroundColor: gradient,
          borderColor: color,
          pointBackgroundColor: theme.palette.common.white,
          pointBorderColor: color,
          pointHoverRadius: 7,
          borderWidth: 3,
          tension: 0.45,
        },
      ],
    };
  };

  const traceChartData = getChartData("Traces", filteredTraces.map(() => 1), theme.palette.secondary.main);
  const costChartData = getChartData("Cost", filteredTraces.map((t) => t.totalCost || 0), theme.palette.secondary.main);

  return (
    <div
      style={{
        padding: "30px",
        fontFamily: "Inter, sans-serif",
        background: "transparent",
        color: theme.palette.text.primary,
        minHeight: "100vh",
      }}
    >

      <div style={{ display: "flex", gap: "20px", marginBottom: "30px" }}>
        <Card title="Total Traces" value={filteredTraces.length} color={theme.palette.primary.main} />
        <Card title="Total Cost" value={`$${totalCost.toFixed(6)}`} color={theme.palette.secondary.main} />
        <Card title="Avg. Latency" value={`${avgLatency.toFixed(2)}s`} color={theme.palette.success.main} />
        <Card title="Scores Tracked" value={0} color={theme.palette.warning.main} />
      </div>

      

      <input
        type="text"
        placeholder="Search by name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: "10px",
          width: "300px",
          marginBottom: "30px",
          borderRadius: "6px",
          border: `1px solid ${theme.palette.divider}`,
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
        }}
      />

      <div style={{ display: "flex", gap: "20px", marginBottom: "40px" }}>
        <div
          style={{
            flex: 1,
            background: theme.palette.background.paper,
            padding: "20px",
            borderRadius: "16px",
            boxShadow: `0 0 20px ${theme.palette.primary.light}22`,
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Line ref={chartRef} data={traceChartData} options={getEnhancedChartOptions("Traces", theme)} />
        </div>
        <div
          style={{
            flex: 1,
            background: theme.palette.background.paper,
            padding: "20px",
            borderRadius: "16px",
            boxShadow: `0 0 20px ${theme.palette.secondary.light}22`,
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Line ref={chartRef} data={costChartData} options={getEnhancedChartOptions("Cost", theme, "$")} />
        </div>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : error ? (
        <p style={{ color: theme.palette.error.main }}>{error}</p>
      ) : (
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            backgroundColor: theme.palette.background.paper,
            borderRadius: "12px",
            overflow: "hidden",
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <thead>
            <tr style={{ backgroundColor: theme.palette.background.default }}>
              <th style={{ padding: "10px" }}>ID</th>
              <th>Name</th>

              <th>Latency</th>
              <th>Cost</th>
              <th>Environment</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredTraces.map((trace) => (
              <tr
                key={trace.id}
                style={{
                  borderBottom: `1px solid ${theme.palette.divider}`,
                  cursor: "pointer",
                }}
                onClick={() => setSelectedTrace(trace)}
              >
                <td style={{ padding: "10px", color: theme.palette.text.secondary }}>{trace.id.slice(0, 8)}...</td>
                <td>{trace.name}</td>
              
                <td>{trace.latency?.toFixed(2)}s</td>
                <td>${trace.totalCost?.toFixed(4)}</td>
                <td>
                  <Badge
                    text={trace.environment || 'default'}
                    bg={theme.palette.secondary.light}
                    textColor={theme?.customization?.isDarkMode ? 'white' : 'black'}
                  />
                </td>
                <td>{new Date(trace.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {selectedTrace && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            height: "100vh",
            width: "100vw",
            background: "#000000aa",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 999,
          }}
          onClick={() => setSelectedTrace(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
             background: theme.palette.background.paper,
              padding: "30px",
              borderRadius: "16px",
              width: "700px",
              color: theme.palette.text.secondary,
              maxHeight: "80vh",
              overflowY: "auto",
              border: `1px solid ${theme.palette.divider}`
            }}
          >
            <h2 style={{ marginBottom: "10px" }}>{selectedTrace.name}</h2>
            <p><strong>ID:</strong> {selectedTrace.id}</p>
            <p><strong>Environment:</strong> {selectedTrace.environment}</p>
            <p><strong>Session:</strong> {selectedTrace.sessionId}</p>
            <p><strong>Latency:</strong> {selectedTrace.latency}s</p>
            <p><strong>Cost:</strong> ${selectedTrace.totalCost}</p>
            <p><strong>Created At:</strong> {new Date(selectedTrace.createdAt).toLocaleString()}</p>
            <hr style={{ margin: "15px 0", borderColor: theme.palette.divider }} />
            <p><strong>Input:</strong></p>
            <pre style={{ background: theme.palette.background.default, padding: "10px", borderRadius: "8px" }}>
              {JSON.stringify(selectedTrace.input, null, 2)}
            </pre>
            <p><strong>Output:</strong></p>
            <pre style={{ background: theme.palette.background.default, padding: "10px", borderRadius: "8px" }}>
              {JSON.stringify(selectedTrace.output, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default CognifuseDashboard;
