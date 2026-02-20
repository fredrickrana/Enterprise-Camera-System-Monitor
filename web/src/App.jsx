import { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

function StatusPill({ status }) {
  const cls =
    status === "online"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${cls}`}>
      {status}
    </span>
  );
}

function Card({ label, value }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm ring-1 ring-gray-200">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="text-2xl font-bold tabular-nums">{value}</div>
    </div>
  );
}

export default function App() {
  const [summary, setSummary] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [error, setError] = useState("");

  async function load() {
    setError("");
    try {
      const [s, c] = await Promise.all([
        fetch(`${API_BASE}/api/summary`).then((r) => r.json()),
        fetch(`${API_BASE}/api/cameras`).then((r) => r.json()),
      ]);
      setSummary(s);
      setCameras(c);
    } catch (e) {
      setError("Could not reach API. Is the backend running?");
    }
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">
          Enterprise Camera System Monitor
        </h1>
        <p className="text-sm text-gray-600 mb-4">
          Live simulation • Auto-refresh every 15s
        </p>

        {error ? (
          <div className="mb-4 rounded-lg bg-red-50 text-red-800 ring-1 ring-red-200 p-3 text-sm">
            {error} Try opening <span className="font-mono">{API_BASE}/api/summary</span>
          </div>
        ) : null}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card label="Total" value={summary?.total ?? 0} />
          <Card label="Offline" value={summary?.offline ?? 0} />
          <Card label="DHCP Fail" value={summary?.dhcpFail ?? 0} />
          <Card label="Old FW" value={summary?.oldFw ?? 0} />
        </div>

        <div className="bg-white rounded-xl shadow-sm ring-1 ring-gray-200 overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-700">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">ID</th>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Site</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">IP</th>
                <th className="px-4 py-3 text-left font-semibold">VLAN</th>
                <th className="px-4 py-3 text-left font-semibold">Firmware</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cameras.slice(0, 50).map((cam) => (
                <tr key={cam.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 tabular-nums">{cam.id}</td>
                  <td className="px-4 py-3 font-medium">{cam.name}</td>
                  <td className="px-4 py-3">{cam.site}</td>
                  <td className="px-4 py-3">
                    <StatusPill status={cam.status} />
                  </td>
                  <td className="px-4 py-3 font-mono">{cam.ip}</td>
                  <td className="px-4 py-3 tabular-nums">{cam.vlan}</td>
                  <td className="px-4 py-3">{cam.firmwareVersion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Showing first 50 cameras (for performance). Data refreshes automatically.
        </p>
      </div>
    </div>
  );
}
