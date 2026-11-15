const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = 'C:\\Users\\zahra\\.gemini\\antigravity\\brain\\f90c6747-ebec-4064-a4df-5578b5988e51';

const targets = [
  {
    name: 'dash_1_world_light_1440.png',
    url: 'http://127.0.0.1:5173/dashboard?theme=light',
    width: 1440,
    height: 900
  },
  {
    name: 'dash_2_world_dark_1440.png',
    url: 'http://127.0.0.1:5173/dashboard?theme=dark',
    width: 1440,
    height: 900
  },
  {
    name: 'dash_3_region_california_light_1440.png',
    url: 'http://127.0.0.1:5173/dashboard?region=california&theme=light',
    width: 1440,
    height: 900
  },
  {
    name: 'dash_4_region_california_dark_1440.png',
    url: 'http://127.0.0.1:5173/dashboard?region=california&theme=dark',
    width: 1440,
    height: 900
  },
  {
    name: 'dash_5_region_tablet_1024.png',
    url: 'http://127.0.0.1:5173/dashboard?region=california&theme=light',
    width: 1024,
    height: 768
  },
  {
    name: 'dash_6_region_mobile_390.png',
    url: 'http://127.0.0.1:5173/dashboard?region=california&theme=light',
    width: 390,
    height: 844
  },
  {
    name: 'dash_7_map_view_switch_1440.png',
    url: 'http://127.0.0.1:5173/map?region=california&theme=light',
    width: 1440,
    height: 900
  },
  {
    name: 'dash_8_drawer_with_dashboard_1440.png',
    url: 'http://127.0.0.1:5173/dashboard?region=california&drawer=open&theme=light',
    width: 1440,
    height: 900
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
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dash_cdp_'));
  const port = 9555;
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
      console.log(`Processing ${t.name} from ${t.url} (${t.width}x${t.height})...`);
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
        mobile: t.width < 500
      });

      // Navigate using native Page.navigate
      await sendCommand(ws, 'Page.navigate', { url: t.url });

      // Poll until skeletons are replaced by actual data or timeout
      let loaded = false;
      for (let i = 0; i < 30; i++) {
        await sleep(500);
        const evalRes = await sendCommand(ws, 'Runtime.evaluate', {
          expression: `Boolean(!document.querySelector('.skeleton-shimmer') && (document.querySelector('h1') || document.querySelector('.maplibregl-canvas')))`
        });
        if (evalRes?.result?.value) {
          loaded = true;
          break;
        }
      }

      // Small additional pause for charts animation to settle
      await sleep(1000);

      const shot = await sendCommand(ws, 'Page.captureScreenshot', {
        format: 'png'
      });

      const outPath = path.join(OUT_DIR, t.name);
      fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
      console.log(`  -> Saved ${t.name}: ${fs.statSync(outPath).size.toLocaleString()} bytes (loaded: ${loaded})`);

      ws.close();
      await fetch(`http://127.0.0.1:${port}/json/close/${pageInfo.id}`);
    }
  } catch (err) {
    console.error('CDP capture error:', err);
  } finally {
    chromeProc.kill();
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
}

run();
