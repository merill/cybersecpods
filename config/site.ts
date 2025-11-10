export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "CyberSecPods",
  description:
    "Curated collection of cybersecurity podcasts covering identity, security, and technology.",
  mainNav: [
    {
      title: "Home",
      href: "/",
    },
    {
      title: "Merill.Net",
      href: "https://merill.net",
    },
    {
      title: "Entra.Chat",
      href: "https://entra.chat",
    },
  ],
  links: {
    twitter: "https://twitter.com/merill",
    github: "https://github.com/merill/cybersecpods",
  },
}
