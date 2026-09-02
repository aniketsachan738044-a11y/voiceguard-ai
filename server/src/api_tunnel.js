const { startTunnel } = require('untun');

async function launchApiTunnel() {
  try {
    console.log('Starting cloudflared API tunnel to http://localhost:5000');
    const tunnel = await startTunnel({ port: 5000 });
    const url = await tunnel.getURL();
    console.log(`BACKEND_API_URL=${url}`);
  } catch (err) {
    console.error('Failed to start Cloudflare API tunnel:', err);
  }
}

launchApiTunnel();
