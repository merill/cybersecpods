/** @type {import('next').NextConfig} */
const nextConfig = {
  // `output: "export"` only at build time. In `next dev` we omit it because
  // App Router dynamic routes with `dynamicParams = false` aren't compatible
  // with the dev server's static-export code path (it throws
  // "missing exported function generateStaticParams()" even when the function
  // is exported correctly). Production export still works via `next build`.
  ...(process.env.NODE_ENV === "production" ? { output: "export" } : {}),
  reactStrictMode: true,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
}

export default nextConfig
