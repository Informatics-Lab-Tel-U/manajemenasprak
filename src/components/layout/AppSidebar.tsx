'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Calendar, AlertTriangle, Database, BookOpen, Network } from 'lucide-react';
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

type NavItem = {
  label: string;
  href: string;
  icon: any;
  items?: { label: string; href: string }[];
};

const navItems: NavItem[] = [
  { label: 'Overview', href: '/', icon: Home },
  { label: 'Data Praktikum', href: '/praktikum', icon: BookOpen },
  { label: 'Mata Kuliah', href: '/mata-kuliah', icon: BookOpen },
  { 
    label: 'Data Asisten Praktikum', 
    href: '#', // Parent item doesn't navigate if it has children, handled by collapsible
    icon: Users,
    items: [
      { label: 'Data Asprak', href: '/asprak?tab=data' },
      { label: 'Plotting Asprak', href: '/plotting' },
      { label: 'Aturan Generasi', href: '/asprak?tab=rules' },
    ]
  },
  { label: 'Jadwal Praktikum', href: '/jadwal', icon: Calendar },
  { label: 'Pelanggaran', href: '/pelanggaran', icon: AlertTriangle },
  { label: 'Database Manager', href: '/database', icon: Database },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg text-sidebar-primary-foreground">
                   <div className="relative h-8 w-8 overflow-hidden rounded-md">
                      <Image src="/iflab.png" alt="Logo" fill className="object-contain" />
                   </div>
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Informatics Lab</span>
                  <span className="truncate text-xs">Admin Portal</span>
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
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.items?.some(sub => pathname === sub.href));
                const hasSubmenu = item.items && item.items.length > 0;

                if (hasSubmenu) {
                   return (
                    <Collapsible key={item.label} defaultOpen={isActive} className="group/collapsible" asChild>
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
                            {item.items?.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.label}>
                                <SidebarMenuSubButton asChild isActive={pathname === subItem.href}>
                                  <Link href={subItem.href}>
                                    <span>{subItem.label}</span>
                                  </Link>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                   )
                }

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive}>
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

      <SidebarRail />
    </Sidebar>
  );
}
