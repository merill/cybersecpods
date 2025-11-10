export type SiteConfig = typeof siteConfig

export const siteConfig = {
  name: "Cybersecurity Podcasts",
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
      title: "Entra.News",
      href: "https://entra.news",
    },
  ],
  links: {
    twitter: "https://twitter.com/merill",
    github: "https://github.com/merill/cybersecpods",
  },
}
