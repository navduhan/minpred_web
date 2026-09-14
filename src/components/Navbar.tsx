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
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3" aria-label="MINpred home">
          <span className="grid h-10 w-10 place-items-center bg-[var(--forest)] font-mono text-sm font-bold text-white">MP</span>
          <span className="font-display text-xl font-semibold tracking-tight text-[var(--forest-dark)]">MINpred</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-5" aria-label="Primary navigation">
          {links.map(({ name, href, icon: Icon }) => {
            const active = pathname === href;
            return <Link key={href} href={href} className={`nav-link ${active ? 'nav-link-active' : ''}`}><Icon className="h-4 w-4" /><span className="hidden sm:inline">{name}</span></Link>;
          })}
        </nav>
        <a href="https://www.usu.edu" target="_blank" rel="noreferrer" className="hidden md:block"><Image src={withBasePath('/assets/images/usulogo2.png')} alt="Utah State University" width={180} height={49} unoptimized /></a>
      </div>
    </header>
  );
}
