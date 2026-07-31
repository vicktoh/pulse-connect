import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /**
   * The whole app renders client-side against Firestore — there is no server
   * data fetching, no dynamic routes and no middleware — so every route
   * prerenders to static HTML. Exporting lets Firebase Hosting serve it as
   * plain files, with no Cloud Functions and no Blaze plan.
   */
  output: "export",

  /**
   * Next's image optimizer is a server feature and is unavailable in an export.
   * The only <Image> on the site is the masthead logo, already sized to the
   * 180x38 it renders at, so there is nothing to optimise away.
   */
  images: { unoptimized: true },
}

export default nextConfig
