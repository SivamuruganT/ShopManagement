/**
 * Render's free tier puts a web service to sleep after ~15 minutes with no
 * inbound requests. This pings the service's own PUBLIC url every 10 minutes.
 * The request leaves the container and comes back in through Render's proxy,
 * so it counts as real inbound traffic and prevents the sleep.
 *
 * Limits worth knowing:
 *  - It can't wake a server that's already asleep (nothing is running to send
 *    the ping). It only keeps an awake one awake - which is fine, because a
 *    deploy or restart leaves the service awake and this starts right away.
 *  - Only runs on Render: RENDER_EXTERNAL_URL is set automatically there, and
 *    absent on your own machine, so local development is unaffected.
 *  - If Render ever starts ignoring self-traffic, or you move to a paid
 *    instance, this is harmless and can simply be deleted.
 */
const INTERVAL_MS = 10 * 60 * 1000;

function startKeepAlive() {
  const baseUrl = process.env.RENDER_EXTERNAL_URL;
  if (!baseUrl) return;

  const url = `${baseUrl.replace(/\/$/, "")}/api/health`;
  setInterval(async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) console.warn(`[keep-alive] ${url} responded ${res.status}`);
    } catch (err) {
      console.warn(`[keep-alive] ping failed: ${err.message}`);
    }
  }, INTERVAL_MS);
  console.log(`[keep-alive] pinging ${url} every 10 minutes`);
}

module.exports = { startKeepAlive };
