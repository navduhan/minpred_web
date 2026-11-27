'use client';

import Link from 'next/link';
import Image from 'next/image';
import { withBasePath } from '@/lib/base-path';
import { usePathname } from 'next/navigation';
import { BookOpen, CloudDownload, FlaskConical, HelpCircle } from 'lucide-react';

const links = [
  { name: 'About', href: '/', icon: BookOpen },
  { name: 'Prediction', href: '/prediction', icon: FlaskConical },
  { name: 'Download', href: '/download', icon: CloudDownload },
  { name: 'Help', href: '/help', icon: HelpCircle },
];

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-50 border-b border-white/12 bg-[#0f2439]/98 text-white shadow-[0_6px_24px_rgba(15,36,57,.18)] backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3" aria-label="MINpred home">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-[#0b7285] font-mono text-sm font-bold text-white shadow-sm">
            MP
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-white">MINpred</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-4" aria-label="Primary navigation">
          {links.map(({ name, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? 'page' : undefined}
                className={`nav-link ${active ? 'nav-link-active' : ''}`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">{name}</span>
              </Link>
            );
          })}
        </nav>
        <a
          href="https://www.usu.edu"
          target="_blank"
          rel="noreferrer"
          className="hidden items-center md:flex"
          aria-label="Utah State University"
        >
          <Image
            src={withBasePath('/assets/images/usulogo2.png')}
            alt="Utah State University"
            width={162}
            height={44}
            className="h-9 w-auto brightness-0 invert opacity-95 transition hover:opacity-100"
            unoptimized
          />
        </a>
      </div>
    </header>
  );
}
