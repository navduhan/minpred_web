'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { withBasePath } from '@/lib/base-path';

const NAV_LINKS = [
  { name: 'Overview', href: '/' },
  { name: 'Predict', href: '/prediction' },
  { name: 'EC Numbers', href: '/ec-numbers' },
  { name: 'CLI Package', href: '/download' },
  { name: 'Guide', href: '/help' },
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
    <header ref={headerRef} className="site-header is-wide">
      {/* Tier 1: Institutional Bar */}
      <div className="inst-bar hidden sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5 text-[13px] font-medium text-[var(--ink-secondary)] sm:px-6 lg:px-8">
          <p className="truncate">
            <a
              href="https://kaabil.net"
              target="_blank"
              rel="noreferrer"
              className="font-bold text-[var(--teal)] hover:underline"
            >
              KAABiL
            </a>
            {' · '}
            <span>Kaundal Bioinformatics Laboratory · Utah State University</span>
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

      {/* Tier 2: Main Navigation Row */}
      <div
        ref={innerRef}
        className="header-inner mx-auto flex h-[62px] max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8"
      >
        <Link href="/" className="group flex items-center gap-3 text-[var(--ink)] no-underline" aria-label="MINpred home">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--navy)] font-mono text-sm font-extrabold text-[var(--pyrite)]">
            MP
          </span>
          <div className="leading-tight">
            <span className="block font-display text-xl font-bold tracking-tight text-[var(--navy)] group-hover:text-[var(--teal)]">
              MINpred
            </span>
            <span className="block text-[13.5px] font-medium text-[var(--ink-secondary)]">
              Soil Nitrogen-Mineralization Enzyme Prediction
            </span>
          </div>
        </Link>

        <nav className="site-nav flex h-full items-center" aria-label="Primary">
          <button
            className="menu-button inline-flex items-center gap-1.5 rounded-lg border border-[var(--line-strong)] bg-white px-3.5 py-2 text-sm font-semibold text-[var(--navy)] hover:border-[var(--teal)] hover:bg-[var(--limestone)]"
            type="button"
            onClick={handleMenuTriggerClick}
            popoverTarget="minpred-site-menu"
            popoverTargetAction="toggle"
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
            {NAV_LINKS.map(({ name, href }) => {
              const active =
                href === '/'
                  ? pathname === '/'
                  : pathname === href || pathname?.startsWith(`${href}/`);
              return (
                <li key={href} className="flex items-center">
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className="mp-nav-link"
                    onClick={closeMobileMenu}
                  >
                    <span>{name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
