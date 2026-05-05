"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"

import { NavItem } from "@/types/nav"
import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"

interface MainNavProps {
  items?: NavItem[]
}

export function MainNav({ items }: MainNavProps) {
  const pathname = usePathname() ?? "/"
  return (
    <div className="flex items-center gap-6 md:gap-10">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/brand/cybersecpods-logo-64.png"
          alt=""
          width={28}
          height={28}
          className="h-7 w-7"
          priority
        />
        <span className="hidden flex-col leading-tight sm:inline-flex">
          <span className="font-bold tracking-tight">{siteConfig.name}</span>
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {siteConfig.tagline}
          </span>
        </span>
      </Link>
      {items?.length ? (
        <nav className="hidden gap-6 md:flex">
          {items.map((item, index) => {
            if (!item.href) return null
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href)
            return (
              <Link
                key={index}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-foreground",
                  active ? "text-foreground" : "text-muted-foreground",
                  item.disabled && "cursor-not-allowed opacity-80"
                )}
              >
                {item.title}
              </Link>
            )
          })}
        </nav>
      ) : null}
    </div>
  )
}
