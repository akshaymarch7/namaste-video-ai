import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  async headers(){return [{source:'/instagram/deletion/:path*',headers:[{key:'Cache-Control',value:'private, no-store'},{key:'Referrer-Policy',value:'no-referrer'},{key:'X-Robots-Tag',value:'noindex, nofollow'}]}];},
  reactStrictMode: true,
  logging: { incomingRequests: { ignore: [/\/api\/instagram\/callback/] } },
};

export default config;
