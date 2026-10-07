import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  logging: { incomingRequests: { ignore: [/\/api\/instagram\/callback/] } },
};

export default config;
