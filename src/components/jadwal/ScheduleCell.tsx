'use client';

import React from 'react';
import { getCourseColor } from '@/utils/colorUtils';
import { Jadwal } from '@/types/database';

interface ScheduleCellProps {
  jadwal: Jadwal;
  onClick?: () => void;
  showLecturer?: boolean;
  showAsprakCount?: boolean;
}

export const ScheduleCell: React.FC<ScheduleCellProps> = ({
  jadwal,
  onClick,
  showLecturer = false,
  showAsprakCount = false,
}) => {
  const isPengganti = jadwal.is_pengganti;
  const bgColor = jadwal.mata_kuliah?.warna || getCourseColor(jadwal.mata_kuliah?.nama_lengkap || '');

  return (
    <div
      onClick={onClick}
      className={`w-full flex-1 flex flex-col items-center justify-center p-1 transition-all overflow-hidden origin-center min-h-[60px] ${
        onClick
          ? 'cursor-pointer hover:brightness-110 hover:scale-105 hover:z-20 hover:shadow-lg'
          : ''
      } ${isPengganti ? 'z-10' : ''}`}
      style={
        isPengganti
          ? {
              background: `linear-gradient(${bgColor}, ${bgColor}) padding-box, repeating-linear-gradient(45deg, #facc15, #facc15 10px, #ffffff 10px, #ffffff 20px) border-box`,
              border: '4px solid transparent',
            }
          : {
              backgroundColor: bgColor,
            }
      }
      title={
        onClick ? 'Click for details' : `${jadwal.mata_kuliah?.nama_lengkap} - ${jadwal.kelas}`
      }
    >
      <div className="text-center leading-tight">
        <div className="font-bold text-[10px] sm:text-xs text-white drop-shadow-md truncate w-full px-1">
          {jadwal.mata_kuliah?.praktikum?.nama || jadwal.mata_kuliah?.nama_lengkap || 'Unknown'}
        </div>
        <div className="text-[9px] sm:text-[10px] text-white/90">{jadwal.kelas}</div>
        {showAsprakCount && (
          <div className="text-[8px] sm:text-[9px] text-white/80 truncate px-1">
            {jadwal.total_asprak || 0} asprak
          </div>
        )}
        {showLecturer && (
          <div className="text-[8px] sm:text-[9px] text-white/80 truncate px-1">
            {(jadwal.dosen || '-').split(' ')[0]}
          </div>
        )}
      </div>
    </div>
  );
};
