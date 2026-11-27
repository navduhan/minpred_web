'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, Menu } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { withBasePath } from '@/lib/base-path';

const NAV_LINKS = [
  { num: '01', name: 'Overview', href: '/' },
  { num: '02', name: 'Predict', href: '/prediction' },
  { num: '03', name: 'Standalone CLI', href: '/download' },
  { num: '04', name: 'Manual', href: '/help' },
] as const;

export default function Navbar() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const lastCollapsedWidth = useRef(0);
  const [fallbackOpen, setFallbackOpen] = useState(false);

  const supportsPopover = () =>
    typeof HTMLElement !== 'undefined' && Object.hasOwn(HTMLElement.prototype, 'popover');

  const syncLayout = useCallback((forceMeasure = false) => {
    const header = headerRef.current;
    const inner = innerRef.current;
    const menu = menuRef.current;
    if (!header || !inner || !menu) return;

    const nativePopover =
      typeof HTMLElement !== 'undefined' && Object.hasOwn(HTMLElement.prototype, 'popover');
    if (!nativePopover) {
      menu.setAttribute('data-fallback-mode', 'true');
    }

    const currentlyWide = header.classList.contains('is-wide');
    const currentWidth = inner.clientWidth;

    if (!currentlyWide && !forceMeasure && currentWidth <= lastCollapsedWidth.current) {
      return;
    }

    const wasOpen = nativePopover && menu.hasAttribute('popover') && menu.matches(':popover-open');
    header.classList.add('is-measuring', 'is-wide');
    menu.removeAttribute('popover');

    const fits = inner.scrollWidth <= inner.clientWidth;
    if (fits) {
      lastCollapsedWidth.current = 0;
      setFallbackOpen(false);
    } else {
      header.classList.remove('is-wide');
      lastCollapsedWidth.current = currentWidth;
      if (nativePopover) {
        menu.setAttribute('popover', 'auto');
        if (wasOpen) {
          try {
            menu.showPopover();
          } catch {
            // Ignore top-layer timing edge cases
          }
        }
      }
    }

    requestAnimationFrame(() => {
      header.classList.remove('is-measuring');
    });
  }, []);

  useEffect(() => {
    syncLayout(true);
    const header = headerRef.current;
    const menu = menuRef.current;
    if (!header || !menu) return;

    const observer = new ResizeObserver(() => syncLayout(false));
    observer.observe(header);
    observer.observe(menu);
    return () => observer.disconnect();
  }, [syncLayout]);

  const closeMobileMenu = () => {
    setFallbackOpen(false);
    const menu = menuRef.current;
    if (supportsPopover() && menu?.hasAttribute('popover') && menu.matches(':popover-open')) {
      try {
        menu.hidePopover();
      } catch {
        // Ignore
      }
    }
  };

  const handleMenuTriggerClick = () => {
    if (!supportsPopover()) {
      setFallbackOpen((prev) => !prev);
    }
  };

  return (
    <header ref={headerRef} className="site-header">
      {/* Tier 1: Warm Limestone Institutional Affiliation Bar */}
      <div className="inst-bar hidden sm:block">
        <div className="mx-auto flex h-8 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <p className="truncate font-mono text-[11px] font-semibold tracking-wide text-[var(--muted)]">
            <span className="font-bold text-[var(--navy)]">UTAH STATE UNIVERSITY</span>
            {' · '}
            <span>DEPT. OF PLANTS, SOILS &amp; CLIMATE</span>
            {' · '}
            <a
              href="https://kaabil.net"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-[var(--teal)] hover:underline"
            >
              KAABiL LAB
            </a>
          </p>

          <div className="flex shrink-0 items-center gap-4">
            <a href="https://kaabil.net" target="_blank" rel="noreferrer" aria-label="KAABiL Lab">
              <Image
                src={withBasePath('/assets/images/lab_logo_red.png')}
                alt="KAABiL Lab"
                width={86}
                height={24}
                className="h-5 w-auto object-contain"
                unoptimized
              />
            </a>
            <span className="h-3.5 w-px bg-[var(--line-strong)]" aria-hidden="true" />
            <a
              href="https://www.usu.edu"
              target="_blank"
              rel="noreferrer"
              aria-label="Utah State University"
            >
              <Image
                src={withBasePath('/assets/images/usulogo2.png')}
                alt="Utah State University"
                width={86}
                height={24}
                className="h-5 w-auto object-contain"
                unoptimized
              />
            </a>
          </div>
        </div>
      </div>

      {/* Tier 2: Crisp Editorial Monograph Masthead & Numbered Index Navigation */}
      <div
        ref={innerRef}
        className="header-inner mx-auto flex h-[58px] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8"
      >
        <Link href="/" className="flex items-baseline gap-3" aria-label="MINpred home">
          <span className="font-display text-2xl font-bold tracking-tight text-[var(--navy)]">
            MINpred
          </span>
          <span className="hidden border-l border-[var(--line-strong)] pl-3 font-mono text-[11px] font-bold uppercase tracking-wider text-[var(--teal)] md:inline">
            Soil N-Mineralization EC Atlas
          </span>
        </Link>

        <div className="flex h-full items-center gap-4">
          <nav className="site-nav flex h-full items-center" aria-label="Primary">
            <button
              className="menu-button inline-flex items-center gap-1.5 rounded-[2px] border border-[var(--navy)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--navy)] hover:bg-[var(--limestone)]"
              type="button"
              onClick={handleMenuTriggerClick}
              {...({
                popovertarget: 'minpred-site-menu',
                popovertargetaction: 'toggle',
              } as Record<string, string>)}
              aria-controls="minpred-site-menu"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
              <span>Menu</span>
            </button>

            <ul
              ref={menuRef}
              id="minpred-site-menu"
              className="site-menu"
              data-fallback-open={fallbackOpen ? 'true' : undefined}
              {...({ popover: 'auto' } as Record<string, string>)}
            >
              {NAV_LINKS.map(({ num, name, href }) => {
                const active =
                  href === '/'
                    ? pathname === '/'
                    : pathname === href || pathname?.startsWith(`${href}/`);
                return (
                  <li key={href} className="flex items-stretch">
                    <Link
                      href={href}
                      aria-current={active ? 'page' : undefined}
                      className="mp-nav-link"
                      onClick={closeMobileMenu}
                    >
                      <span className="font-mono text-[11px] font-bold text-[var(--ochre)]">
                        {num}
                      </span>
                      <span>{name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <Link
            href="/prediction"
            className="btn-amber hidden !min-h-0 !py-1.5 !px-3.5 !text-xs sm:inline-flex"
          >
            <span>Predict FASTA</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
