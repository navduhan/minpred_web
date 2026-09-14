import Image from 'next/image';
import { withBasePath } from '@/lib/base-path';

export default function Footer() {
  return <footer className="mt-auto border-t border-[var(--line)] bg-white py-6">
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:px-6 md:flex-row lg:px-8">
      <p>© {new Date().getFullYear()} KAABiL Lab · Utah State University</p>
      <div className="flex items-center gap-6">
        <a href="https://bioinfo.usu.edu" target="_blank" rel="noreferrer"><Image src={withBasePath('/assets/images/lab_logo_red.png')} alt="KAABiL Lab" width={133} height={40} className="h-8 w-auto object-contain" /></a>
        <a href="https://www.usu.edu" target="_blank" rel="noreferrer"><Image src={withBasePath('/assets/images/usulogo2.png')} alt="Utah State University" width={129} height={40} className="h-8 w-auto object-contain" /></a>
      </div>
    </div>
  </footer>;
}
