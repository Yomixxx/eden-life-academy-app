import { execSync } from 'node:child_process'

/** @type {import('next').NextConfig} */

// Stamp the build with the exact commit it came from so the live site can be
// identified in one request. Without this we cannot tell "the code is wrong"
// apart from "an old build is being served" without digging through Vercel —
// which is precisely the failure mode that bit us twice on 15 Sep 2026 (a
// preview build got promoted to production and silently rolled the site back).
//
// On Vercel these come from the platform; locally we fall back to git so the
// endpoint is still useful in dev.
function gitInfo(args) {
  try {
    return execSync(`git ${args}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return ''
  }
}

const BUILD_SHA = process.env.VERCEL_GIT_COMMIT_SHA || gitInfo('rev-parse HEAD')
const BUILD_REF = process.env.VERCEL_GIT_COMMIT_REF || gitInfo('rev-parse --abbrev-ref HEAD')

const nextConfig = {
  output: process.env.VERCEL ? undefined : 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_BUILD_SHA: BUILD_SHA,
    NEXT_PUBLIC_BUILD_REF: BUILD_REF,
    // Server-only: Vercel's deployment id, for matching a build to the
    // dashboard entry that serves it.
    BUILD_DEPLOYMENT_ID: process.env.VERCEL_DEPLOYMENT_ID || '',
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rpkxyuohbmbbzoqkulgn.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
