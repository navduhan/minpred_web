import Image from 'next/image';
import Link from 'next/link';
import { withBasePath } from '@/lib/base-path';

export default function Footer() {
  return (
    <footer className="mt-14 border-t border-[var(--line-strong)] bg-[var(--limestone)] py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="space-y-1.5">
            <p className="font-display text-base font-bold text-[var(--navy)]">
              MINpred · Soil Nitrogen-Mineralization Enzyme Server
            </p>
            <p className="text-sm text-[var(--ink-secondary)]">
              Kaundal Artificial Intelligence &amp; Advanced Bioinformatics Laboratory (KAABiL), Department of Plants, Soils and Climate, Utah State University.
            </p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 pt-1 text-sm font-semibold text-[var(--teal)]">
              <Link href="/prediction" className="hover:underline">
                Predict Sequences
              </Link>
              <Link href="/ec-numbers" className="hover:underline">
                EC Numbers
              </Link>
              <Link href="/download" className="hover:underline">
                CLI Package
              </Link>
              <Link href="/help" className="hover:underline">
                User Guide
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
          </div>

          <div className="flex flex-wrap items-center gap-6">
            <a href="https://kaabil.net" target="_blank" rel="noreferrer">
              <Image
                src={withBasePath('/assets/images/lab_logo_red.png')}
                alt="KAABiL Lab"
                width={116}
                height={34}
                className="h-8 w-auto object-contain"
                unoptimized
              />
            </a>
            <a href="https://www.usu.edu" target="_blank" rel="noreferrer">
              <Image
                src={withBasePath('/assets/images/usulogo2.png')}
                alt="Utah State University"
                width={112}
                height={34}
                className="h-8 w-auto object-contain"
                unoptimized
              />
            </a>
          </div>
        </div>

        <div className="mt-6 border-t border-[var(--line)] pt-4 text-sm text-[var(--ink-secondary)] sm:flex sm:items-center sm:justify-between">
          <span>&copy; {new Date().getFullYear()} KAABiL Lab, Utah State University. Open academic web resource.</span>
          <span>Contact: naveen.duhan@usu.edu · rkaundal@usu.edu</span>
        </div>
      </div>
    </footer>
  );
}
