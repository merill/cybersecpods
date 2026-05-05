export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "CyberSecPods",
  tagline: "The home of cybersecurity podcasts",
  url: "https://cybersecpods.com",
  description:
    "The home of cybersecurity podcasts. Curated shows on threat intel, identity, cloud security, red team, blue team, and more — with the latest episodes always at your fingertips.",
  ogImage: "https://cybersecpods.com/og.png",
  mainNav: [
    { title: "Home", href: "/" },
    { title: "Podcasts", href: "/podcasts/" },
    { title: "Episodes", href: "/episodes/" },
    { title: "Tags", href: "/tags/" },
    { title: "About", href: "/about/" },
  ],
  links: {
    twitter: "https://twitter.com/merill",
    github: "https://github.com/merill/cybersecpods",
    author: "https://merill.net",
  },
}
