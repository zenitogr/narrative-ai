/** @type {import('next').NextConfig} */
const nextConfig = {};

import withPWA from "next-pwa";

const configWithPWA = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
})(nextConfig);

export default configWithPWA;