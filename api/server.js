import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const TOTAL_CAMERAS = 300;

const SITE_RULES = {
  T4:   { vlan: 100, subnetPrefix: "10.51.100." },
  T5:   { vlan: 200, subnetPrefix: "10.51.200." },
  TBIT: { vlan: 300, subnetPrefix: "10.51.300." },
};

const APPROVED_FIRMWARE = ["10.12.221", "9.80.5"];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function makeDhcpFailIp() {
  return `169.254.${randInt(0, 255)}.${randInt(1, 254)}`;
}

// GENERATE CAMERAS

function generateFleet(count) {
  const sites = Object.keys(SITE_RULES);
  const fleet = [];

  for (let i = 0; i < count; i++) {
    const site = pick(sites);

    const rule = SITE_RULES[site];

    const host = (i % 254) + 1;
    const ip = `${rule.subnetPrefix}${host}`;

    fleet.push({
      id: i,
      name: `${site}-CAM-${String(i).padStart(3, "0")}`,
      status: "online",
      site,
      ip,
      vlan: rule.vlan,
      firmwareVersion: pick(APPROVED_FIRMWARE)
    });
  }

  return fleet;
}

let cameras = generateFleet(TOTAL_CAMERAS);

// SIMULATION (every 10 seconds)

function simulateTick() {
  for (const cam of cameras) {
    const rule = SITE_RULES[cam.site];

    cam.status = Math.random() < 0.03 ? "offline" : "online";

    if (Math.random() < 0.01) {
      cam.ip = makeDhcpFailIp();
    } else {
      cam.ip = `${rule.subnetPrefix}${randInt(1, 254)}`;
    }

    if (Math.random() < 0.02) {
      cam.vlan = pick([100, 200, 300]);
    } else {
      cam.vlan = rule.vlan;
    }

    cam.firmwareVersion = Math.random() < 0.03 ? "8.0.0" : pick(APPROVED_FIRMWARE);
  }
}

setInterval(simulateTick, 10000);

// API ROUTES

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.get("/api/cameras", (req, res) => {
  res.json(cameras);
});

app.get("/api/summary", (req, res) => {
  const offline = cameras.filter(c => c.status === "offline").length;
  const dhcpFail = cameras.filter(c => c.ip.startsWith("169.254.")).length;
  const wrongVlan = cameras.filter(c => c.vlan !== SITE_RULES[c.site].vlan).length;
  const oldFw = cameras.filter(c => c.firmwareVersion === "8.0.0").length;

  res.json({
    total: cameras.length,
    offline,
    online: cameras.length - offline,
    dhcpFail,
    wrongVlan,
    oldFw
  });
});

app.post("/api/sim/tick", (req, res) => {
  simulateTick();
  res.json({ ok: true });
});

app.post("/api/sim/reset", (req, res) => {
  cameras = generateFleet(TOTAL_CAMERAS);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`API running at http://localhost:${PORT}`);
  console.log(`Try: http://localhost:${PORT}/api/cameras`);
  console.log(`Try: http://localhost:${PORT}/api/summary`);
});
