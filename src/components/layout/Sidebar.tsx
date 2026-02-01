'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Calendar, AlertTriangle, Settings, Database } from 'lucide-react';
import styles from './Sidebar.module.css';

const navItems = [
  { label: 'Dashboard', href: '/', icon: Home },
  { label: 'Data Asprak', href: '/asprak', icon: Users },
  { label: 'Jadwal Praktikum', href: '/jadwal', icon: Calendar },
  { label: 'Pelanggaran', href: '/pelanggaran', icon: AlertTriangle },
  { label: 'Database Manager', href: '/database', icon: Database },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className={styles.logo}>
        <div className={styles.logoIcon}>CL</div>
        <div>
          <h1 className={styles.brand}>CASLAB</h1>
          <p className={styles.subtitle}>Admin Portal</p>
        </div>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className={styles.footer}>
        <div className={styles.user}>
          <div className={styles.avatar}>A</div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>Admin</p>
            <p className={styles.userRole}>Super User</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
