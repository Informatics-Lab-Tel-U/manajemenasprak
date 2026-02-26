'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Home,
  Users,
  Calendar,
  AlertTriangle,
  BookOpen,
  HelpCircle,
  Settings,
  Notebook,
  Logs,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronRight } from 'lucide-react';
import { AccountSwitcher } from '../sidebar/AccountSwitcher';
import type { Role } from '@/config/rbac';
import { hasAccess } from '@/config/rbac';

type NavSubItem = {
  label: string;
  href: string;
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  /** If provided, the item expands into sub-items */
  items?: NavSubItem[];
};

/**
 * All possible nav items. Visibility is controlled by `hasAccess()` from rbac.ts.
 * Add new items here — no need to touch the sidebar render logic.
 */
const ALL_NAV_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/', icon: Home },
  { label: 'Data Praktikum', href: '/praktikum', icon: BookOpen },
  { label: 'Mata Kuliah', href: '/mata-kuliah', icon: BookOpen },
  {
    label: 'Data Asisten Praktikum',
    href: '#',
    icon: Users,
    items: [
      { label: 'Data Asprak', href: '/asprak?tab=data' },
      { label: 'Generate Kode Asprak', href: '/asprak?tab=rules' },
    ],
  },
  { label: 'Jadwal Praktikum', href: '/jadwal', icon: Calendar },
  { label: 'Pelanggaran', href: '/pelanggaran', icon: AlertTriangle },
  { label: 'Manajemen Akun', href: '/manajemen-akun', icon: Notebook },
  { label: 'Audit Logs', href: '/audit-logs', icon: Logs },
  { label: 'Panduan Sistem', href: '/panduan', icon: HelpCircle },
  { label: 'Pengaturan', href: '/pengaturan', icon: Settings },
];

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: {
    nama: string;
    email: string;
    role: Role;
  };
};

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const visibleNavItems = ALL_NAV_ITEMS.filter((item) => {
    if (item.items) {
      // Show parent if any sub-item is accessible
      return item.items.some((sub) => hasAccess(user.role, sub.href));
    }
    return hasAccess(user.role, item.href);
  });

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square bg-white p-0.5 size-10 items-center justify-center rounded-lg text-sidebar-primary-foreground">
                  <div className="relative w-full h-full overflow-hidden rounded-md">
                    <Image src="/iflab.png" alt="Logo" fill className="object-contain" />
                  </div>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Informatics Lab</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.role === 'ADMIN'
                      ? 'Admin Portal'
                      : user.role === 'ASLAB'
                        ? 'Aslab Portal'
                        : 'Koor Portal'}
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  item.items?.some((sub) => pathname.startsWith(sub.href.split('?')[0]));
                const hasSubmenu = item.items && item.items.length > 0;

                if (hasSubmenu) {
                  const visibleSubItems = item.items!.filter((sub) =>
                    hasAccess(user.role, sub.href)
                  );
                  return (
                    <Collapsible
                      key={item.label}
                      defaultOpen={isActive}
                      className="group/collapsible"
                      asChild
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton tooltip={item.label} isActive={isActive}>
                            <Icon />
                            <span>{item.label}</span>
                            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {visibleSubItems.map((subItem) => {
                              // Precise active matching checking query params
                              const [basePath, query] = subItem.href.split('?');
                              const isSubActive =
                                pathname.startsWith(basePath) &&
                                (!query || searchParams?.toString().includes(query));

                              return (
                                <SidebarMenuSubItem key={subItem.href}>
                                  <SidebarMenuSubButton asChild isActive={isSubActive}>
                                    <Link href={subItem.href}>
                                      <span>{subItem.label}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href || pathname.startsWith(item.href + '/')}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <Icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <AccountSwitcher nama={user.nama} email={user.email} role={user.role} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
