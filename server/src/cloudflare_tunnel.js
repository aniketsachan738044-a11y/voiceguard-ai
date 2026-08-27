async function launchCloudflareTunnel() {
  const { startTunnel } = await import('untun');
  try {
    const tunnel = await startTunnel({
      port: 3000,
      acceptCloudflareNotice: true
    });

    const url = await tunnel.getURL();
    process.stdout.write(`\nCLOUDFLARE_URL=${url}\n`);
  } catch (err) {
    process.stderr.write(`\nCloudflare Tunnel Error: ${err.message}\n`);
  }
}

launchCloudflareTunnel();
