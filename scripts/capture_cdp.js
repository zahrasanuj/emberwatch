const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT_DIR = 'C:\\Users\\zahra\\.gemini\\antigravity\\brain\\f90c6747-ebec-4064-a4df-5578b5988e51';

const targets = [
  {
    name: 'screen_14_data_status_firms_avail_1440.png',
    url: 'http://127.0.0.1:5173/?page=map&view=data-status',
    width: 1440,
    height: 900
  },
  {
    name: 'screen_20_verify_audit_drawer_1440.png',
    url: 'http://127.0.0.1:5173/?page=map&region=california&audit=detections_7d',
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
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cdp_shots_'));
  const port = 9333;
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
      console.log(`Capturing ${t.name} from ${t.url} (${t.width}x${t.height})...`);
      const newRes = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(t.url)}`, { method: 'PUT' });
      const pageInfo = await newRes.json();

      const ws = new WebSocket(pageInfo.webSocketDebuggerUrl);
      await new Promise((resolve) => ws.addEventListener('open', resolve));

      await sendCommand(ws, 'Emulation.setDeviceMetricsOverride', {
        width: t.width,
        height: t.height,
        deviceScaleFactor: 1,
        mobile: t.width < 500
      });

      // Wait 7s for React hooks and data fetches to complete and render
      await sleep(7000);

      const shot = await sendCommand(ws, 'Page.captureScreenshot', {
        format: 'png'
      });

      const outPath = path.join(OUT_DIR, t.name);
      fs.writeFileSync(outPath, Buffer.from(shot.data, 'base64'));
      console.log(`  -> Saved ${t.name}: ${fs.statSync(outPath).size.toLocaleString()} bytes`);

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
