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
      } ${isPengganti ? 'z-10' : ''} ${isOnlineActive ? 'z-20' : ''}`}
      style={contentStyle}
      title={
        onClick ? 'Click for details' : `${jadwal.mata_kuliah?.nama_lengkap} - ${jadwal.kelas}`
      }
    >
      {isOnlineActive && (
        <>
          {/* Animated spinning background overlaying the outer border */}
          <div 
            className="absolute inset-[-150%] animate-[spin_2.5s_linear_infinite] z-20 pointer-events-none" 
            style={{ background: 'conic-gradient(from 90deg at 50% 50%, transparent 60%, rgba(34,197,94,0.95) 100%)' }} 
          />
          {/* Inner content mask. 
              If Pengganti (has 4px border), inset-0 covers padding box, leaving border exposed.
              If Reguler (no border), inset-[3px] creates a 3px gap for the spinning gradient. */}
          <div 
            className={`absolute z-20 pointer-events-none ${isPengganti ? 'inset-0' : 'inset-[3px] rounded-sm'}`} 
            style={{ backgroundColor: bgColor }} 
          />
        </>
      )}

      <div className="text-center leading-tight relative z-30">
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
