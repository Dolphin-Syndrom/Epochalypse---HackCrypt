'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Image as ImageIcon, 
  Video, 
  Mic, 
  Sparkles, 
  UserCircle
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const navItems = [
  { name: 'Image Detection', href: '/image', icon: ImageIcon },
  { name: 'Video Detection', href: '/video', icon: Video },
  { name: 'Audio Detection', href: '/audio', icon: Mic },
  { name: 'AI Content', href: '/ai-generated', icon: Sparkles },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] flex flex-col transition-all duration-300 z-50">
      <div className="p-6 border-b border-[var(--sidebar-border)] flex items-center gap-3">
        <div className="w-8 h-8 bg-[var(--primary)] rounded-md flex items-center justify-center">
            <Sparkles className="text-black w-5 h-5" />
        </div>
        <h1 className="font-bold text-lg tracking-wide text-white">DeepDetect</h1>
      </div>

      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4 px-2">Analysis Tools</div>
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={twMerge(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive 
                  ? "bg-[rgba(138,180,248,0.1)] text-[var(--primary)]" 
                  : "text-gray-400 hover:text-gray-100 hover:bg-[rgba(255,255,255,0.05)]"
              )}
            >
              <item.icon className={clsx("w-5 h-5", isActive ? "text-[var(--primary)]" : "text-gray-400")} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[var(--sidebar-border)]">
        <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-gray-100 hover:bg-[rgba(255,255,255,0.05)] transition-colors">
          <UserCircle className="w-8 h-8 text-gray-400" />
          <div className="flex flex-col items-start">
            <span className="text-white text-sm">Guest User</span>
            <span className="text-xs text-gray-500">Free Tier</span>
          </div>
        </button>
      </div>
    </aside>
  );
}
