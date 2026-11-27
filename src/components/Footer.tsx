import Image from 'next/image';
import Link from 'next/link';
import { withBasePath } from '@/lib/base-path';

export default function Footer() {
  return (
    <footer className="mt-16 border-t-2 border-[var(--navy)] bg-[var(--limestone)] py-8">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 text-xs text-[var(--muted)] sm:px-6 md:grid-cols-[1.35fr_1fr_auto] md:items-center lg:px-8">
        <div className="space-y-1">
          <p className="font-display text-base font-bold text-[var(--navy)]">
            MINpred · Soil Nitrogen-Mineralization Enzyme Atlas
          </p>
          <p>
            Kaundal Artificial Intelligence &amp; Advanced Bioinformatics Lab (KAABiL) · Department
            of Plants, Soils &amp; Climate · Utah State University
          </p>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[11px] font-bold">
          <Link href="/prediction" className="text-[var(--navy)] hover:text-[var(--teal)] hover:underline">
            Analyze Sequences
          </Link>
          <Link href="/download" className="text-[var(--navy)] hover:text-[var(--teal)] hover:underline">
            Standalone CLI
          </Link>
          <Link href="/help" className="text-[var(--navy)] hover:text-[var(--teal)] hover:underline">
            Manual &amp; Cite
          </Link>
          <a
            href="https://github.com/usubioinfo/minpred"
            target="_blank"
            rel="noreferrer"
            className="text-[var(--ochre)] hover:underline"
          >
            GitHub ↗
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-5">
          <a href="https://kaabil.net" target="_blank" rel="noreferrer">
            <Image
              src={withBasePath('/assets/images/lab_logo_red.png')}
              alt="KAABiL Lab"
              width={120}
              height={34}
              className="h-7 w-auto object-contain"
              unoptimized
            />
          </a>
          <a href="https://www.usu.edu" target="_blank" rel="noreferrer">
            <Image
              src={withBasePath('/assets/images/usulogo2.png')}
              alt="Utah State University"
              width={116}
              height={34}
              className="h-7 w-auto object-contain"
              unoptimized
            />
          </a>
        </div>
      </div>
    </footer>
  );
}
