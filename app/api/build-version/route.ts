import { NextResponse } from 'next/server'

// Public, unauthenticated, and prerendered at build time: it reports which
// commit the *currently served bundle* was built from. This is the fastest
// possible answer to "why isn't my change showing up?" — compare `commit` here
// with the newest Production deployment on GitHub → Environments (or the
// Vercel dashboard's Production tab). If they differ, production is serving a
// stale build and no amount of database fixing will help.
//
// Deliberately exposes nothing sensitive: a commit SHA is already public in
// the repo's HTML/JS asset hashes.
export async function GET() {
  const sha = process.env.NEXT_PUBLIC_BUILD_SHA || ''

  return NextResponse.json(
    {
      app: 'eden-life-academy-app',
      commit: sha,
      shortCommit: sha.slice(0, 7),
      ref: process.env.NEXT_PUBLIC_BUILD_REF || '',
      deploymentId: process.env.BUILD_DEPLOYMENT_ID || '',
      environment: process.env.VERCEL_ENV || 'local',
      // When the SHA could not be determined the banner check must stay quiet
      // rather than cry wolf, so the UI keys off this flag.
      known: sha.length > 0,
    },
    {
      headers: {
        // Never let a CDN/browser cache this: the whole point is that it
        // describes the build answering *right now*.
        'cache-control': 'no-store, max-age=0',
      },
    },
  )
}
// Force redeploy check at 2026-09-15T21:04:12Z - verifying previous updates are live
