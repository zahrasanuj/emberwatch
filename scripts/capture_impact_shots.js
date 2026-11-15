const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = 'C:\\Users\\zahra\\.gemini\\antigravity\\brain\\f90c6747-ebec-4064-a4df-5578b5988e51';

const targets = [
  {
    name: 'impact_1_stacked_light_1440.png',
    url: 'http://127.0.0.1:5173/map?region=california&theme=light&impact=open',
    width: 1440,
    height: 900,
    beforeShot: async (ws) => {
      await sleep(5000);
      await sendCommand(ws, 'Runtime.evaluate', {
        expression: `
          window.__STORE__.getState().setImpactOpen(true);
          window.__STORE__.getState().setImpactMinimised(false);
          window.__STORE__.getState().setImpactMaximised(false);
          window.__STORE__.getState().setInsightsMinimised(false);
          window.__STORE__.getState().setInsightsMaximised(false);
        `
      });
      await sleep(2500);
    }
  },
  {
    name: 'impact_2_stacked_dark_1440.png',
    url: 'http://127.0.0.1:5173/map?region=california&theme=dark&impact=open',
    width: 1440,
    height: 900,
    beforeShot: async (ws) => {
      await sleep(5000);
      await sendCommand(ws, 'Runtime.evaluate', {
        expression: `
          window.__STORE__.getState().setImpactOpen(true);
          window.__STORE__.getState().setImpactMinimised(false);
          window.__STORE__.getState().setImpactMaximised(false);
          window.__STORE__.getState().setInsightsMinimised(false);
          window.__STORE__.getState().setInsightsMaximised(false);
        `
      });
      await sleep(2500);
    }
  },
  {
    name: 'impact_3_impact_minimized_1440.png',
    url: 'http://127.0.0.1:5173/map?region=california&theme=light&impact=open',
    width: 1440,
    height: 900,
    beforeShot: async (ws) => {
      await sleep(4000);
      await sendCommand(ws, 'Runtime.evaluate', {
        expression: `
          window.__STORE__.getState().setImpactOpen(true);
          window.__STORE__.getState().setImpactMinimised(true);
          window.__STORE__.getState().setImpactMaximised(false);
        `
      });
      await sleep(1500);
    }
  },
  {
    name: 'impact_4_impact_maximized_1440.png',
    url: 'http://127.0.0.1:5173/map?region=california&theme=light&impact=open',
    width: 1440,
    height: 900,
    beforeShot: async (ws) => {
      await sleep(4000);
      await sendCommand(ws, 'Runtime.evaluate', {
        expression: `
          window.__STORE__.getState().setImpactOpen(true);
          window.__STORE__.getState().setImpactMaximised(true);
        `
      });
      await sleep(1500);
    }
  },
  {
    name: 'impact_5_hotspot_selected_1440.png',
    url: 'http://127.0.0.1:5173/map?region=california&theme=light&impact=open',
    width: 1440,
    height: 900,
    beforeShot: async (ws) => {
      await sleep(4000);
      await sendCommand(ws, 'Runtime.evaluate', {
        expression: `
          window.__STORE__.getState().setImpactOpen(true);
          window.__STORE__.getState().setImpactMinimised(false);
          window.__STORE__.getState().setImpactMaximised(false);
          window.__STORE__.getState().setInsightsMinimised(false);
          window.__STORE__.getState().setSelectedHotspot({
            lat: 38.5,
            lon: -121.5,
            frp: 74.5,
            instrument: 'VIIRS 375m',
            daynight: 'D',
            confidence: 'nominal',
            acq_date: '2026-11-14',
            acq_time: '1330'
          });
        `
      });
      await sleep(4000);
    }
  },
  {
    name: 'impact_6_reference_mode_1440.png',
    url: 'http://127.0.0.1:5173/map?region=california&theme=light&impact=open',
    width: 1440,
    height: 900,
    beforeShot: async (ws) => {
      await sleep(4000);
      await sendCommand(ws, 'Runtime.evaluate', {
        expression: `
          window.__STORE__.getState().setImpactOpen(true);
          window.__STORE__.getState().setImpactMinimised(false);
          window.__STORE__.getState().setImpactMaximised(false);
          window.__STORE__.getState().setInsightsMinimised(false);
          window.__STORE__.getState().setImpactReferenceLevel('extreme');
        `
      });
      await sleep(2500);
    }
  },
  {
    name: 'impact_7_mobile_bottom_sheet_390.png',
    url: 'http://127.0.0.1:5173/map?region=california&theme=light&impact=open',
    width: 390,
    height: 844,
    mobile: true,
    beforeShot: async (ws) => {
      await sleep(4000);
      await sendCommand(ws, 'Runtime.evaluate', {
        expression: `
          window.__STORE__.getState().setImpactOpen(true);
          window.__STORE__.getState().setImpactMinimised(false);
          window.__STORE__.getState().setImpactMaximised(false);
        `
      });
      await sleep(2000);
    }
  },
  {
    name: 'impact_8_dashboard_section_1440.png',
    url: 'http://127.0.0.1:5173/dashboard?region=california&theme=light',
    width: 1440,
    height: 900,
    beforeShot: async (ws) => {
      await sleep(4500);
      await sendCommand(ws, 'Runtime.evaluate', {
        expression: `
          const card = document.getElementById('sec-impact');
          if (card) {
            card.scrollIntoView({ behavior: 'instant', block: 'start' });
          } else {
            const scrollContainer = document.querySelector('.overflow-y-auto');
            if (scrollContainer) scrollContainer.scrollTop = 2400;
          }
        `
      });
      await sleep(1500);
    }
  }
];

function sendCommand(ws, method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = Math.floor(Math.random() * 1000000);
    const handler = (msg) => {
      try {
        const data = JSON.parse(msg.data.toString());
        if (data.id === id) {
          ws.removeEventListener('message', handler);
          if (data.error) reject(data.error);
          else resolve(data.result);
        }
      } catch (err) {
        reject(err);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function run() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'impact_cdp_'));
  const port = 9533;
  const chromeProc = spawn(CHROME, [
    '--headless=new',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${tempDir}`,
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run'
  ]);

  await sleep(2000);

  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/json/version`);
    const versionInfo = await listRes.json();
    console.log('Connected to Chrome:', versionInfo.Browser);

    for (const t of targets) {
      console.log(`Processing ${t.name} (${t.width}x${t.height})...`);
      const newRes = await fetch(`http://127.0.0.1:${port}/json/new`, { method: 'PUT' });
      const pageInfo = await newRes.json();

      const ws = new WebSocket(pageInfo.webSocketDebuggerUrl);
      await new Promise((resolve) => ws.addEventListener('open', resolve));

      await sendCommand(ws, 'Page.enable');
      await sendCommand(ws, 'Runtime.enable');
      await sendCommand(ws, 'Emulation.setDeviceMetricsOverride', {
        width: t.width,
        height: t.height,
        deviceScaleFactor: 1,
        mobile: !!t.mobile
      });

      await sendCommand(ws, 'Page.navigate', { url: t.url });

      if (t.beforeShot) {
        await t.beforeShot(ws);
      } else {
        await sleep(4000);
      }

      const shot = await sendCommand(ws, 'Page.captureScreenshot', { format: 'png' });
      const buffer = Buffer.from(shot.data, 'base64');
      const outPath = path.join(OUT_DIR, t.name);
      fs.writeFileSync(outPath, buffer);
      console.log(`Saved screenshot: ${outPath} (${buffer.length} bytes)`);

      await sendCommand(ws, 'Page.close');
      ws.close();
      await sleep(400);
    }
    console.log('All screenshots captured successfully!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    try {
      chromeProc.kill('SIGTERM');
    } catch (e) {}
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {}
  }
}

run();
