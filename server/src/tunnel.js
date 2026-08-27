const localtunnel = require('localtunnel');

async function startTunnel() {
  try {
    const tunnel = await localtunnel({ port: 3000 });
    process.stdout.write(`\nPUBLIC_URL=${tunnel.url}\n`);

    tunnel.on('close', () => {
      process.stdout.write('\n[Tunnel] Closed. Reconnecting...\n');
      setTimeout(startTunnel, 1000);
    });

    tunnel.on('error', (err) => {
      process.stdout.write(`\n[Tunnel Error] ${err.message}\n`);
    });
  } catch (err) {
    process.stdout.write(`\n[Launch Error] ${err.message}\n`);
    setTimeout(startTunnel, 2000);
  }
}

startTunnel();
