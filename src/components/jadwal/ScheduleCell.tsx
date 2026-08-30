'use client';

import React from 'react';
import { getCourseColor } from '@/utils/colorUtils';
import { Jadwal } from '@/types/database';

interface ScheduleCellProps {
  jadwal: Jadwal;
  onClick?: () => void;
  showLecturer?: boolean;
  showAsprakCount?: boolean;
  isOnlineActive?: boolean;
}

export const ScheduleCell: React.FC<ScheduleCellProps> = ({
  jadwal,
  onClick,
  showLecturer = false,
  showAsprakCount = false,
  isOnlineActive = false,
}) => {
  const isPengganti = jadwal.is_pengganti;
  const bgColor =
    jadwal.mata_kuliah?.warna || getCourseColor(jadwal.mata_kuliah?.nama_lengkap || '');

  const contentStyle = isPengganti
    ? {
      background: `linear-gradient(${bgColor}, ${bgColor}) padding-box, repeating-linear-gradient(45deg, #facc15, #facc15 10px, #ffffff 10px, #ffffff 20px) border-box`,
      border: '4px solid transparent',
    }
    : {
      backgroundColor: bgColor,
    };

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      className={`relative w-full flex-1 flex flex-col items-center justify-center p-1 transition-all overflow-hidden origin-center min-h-[60px] 2xl:min-h-[80px] ${
        onClick
          ? 'cursor-pointer hover:brightness-110 hover:scale-105 hover:z-20 hover:shadow-lg'
          : ''
      } ${isPengganti ? 'z-10' : ''} ${isOnlineActive ? 'z-20 bg-slate-200 dark:bg-slate-800' : ''}`}
      style={isOnlineActive ? {} : contentStyle}
      title={
        onClick ? 'Click for details' : `${jadwal.mata_kuliah?.nama_lengkap} - ${jadwal.kelas}`
      }
    >
      {isOnlineActive && (
        <>
          {/* Inner content mask (diletakkan di belakang ular) */}
          <div className="absolute inset-[3px] z-0" style={contentStyle} />

          <style>{`
            @keyframes snake-crawl {
              0% { stroke-dashoffset: 0; }
              100% { stroke-dashoffset: -100; }
            }
          `}</style>
          
          {/* Efek grid dan ular bergaya retro game Snake */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-10">
            {/* Rel Grid Latar Belakang (Kotak-kotak kosong) */}
            <rect
              className="stroke-green-700/25 dark:stroke-green-400/20"
              x="0" y="0" width="100%" height="100%"
              fill="none"
              strokeWidth="6"
              pathLength="100"
              strokeDasharray="3 1"
            />
            
            {/* Ular (Kotak-kotak menyala yang melompat sel per sel) */}
            <rect
              className="stroke-green-700 dark:stroke-green-400 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] dark:drop-shadow-[0_0_4px_rgba(74,222,128,0.8)]"
              x="0" y="0" width="100%" height="100%"
              fill="none"
              strokeWidth="6"
              pathLength="100"
              strokeDasharray="3 1 3 1 3 1 3 85"
              style={{ animation: 'snake-crawl 2s steps(25) infinite' }}
            />
          </svg>
        </>
      )}

      <div className="text-center leading-tight relative z-10">
        <div className="font-bold text-[10px] sm:text-xs 2xl:text-sm text-white drop-shadow-md truncate w-full px-1">
          {jadwal.mata_kuliah?.praktikum?.nama || jadwal.mata_kuliah?.nama_lengkap || 'Unknown'}
        </div>
        <div className="text-[9px] sm:text-[10px] 2xl:text-xs text-white/90">{jadwal.kelas}</div>
        {showAsprakCount && (
          <div className="text-[8px] sm:text-[9px] 2xl:text-[10px] text-white/80 truncate px-1">
            {jadwal.total_asprak || 0} asprak
          </div>
        )}
        {showLecturer && (
          <div className="text-[8px] sm:text-[9px] 2xl:text-[10px] text-white/80 truncate px-1">
            {(jadwal.dosen || '-').split(' ')[0]}
          </div>
        )}
      </div>
    </div>
  );
};
