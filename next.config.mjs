import { networkInterfaces } from "os";

// Discover every non-loopback IPv4 address on this machine so that
// mobile devices on the same LAN can reach /_next/* dev-server assets.
const localIPs = Object.values(networkInterfaces())
  .flat()
  .filter((n) => n && n.family === "IPv4" && !n.internal)
  .map((n) => n.address);

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: localIPs,
};

export default nextConfig;
