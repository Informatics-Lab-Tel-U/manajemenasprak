'use client';

import React, { useMemo } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  addMonths,
  addDays,
  parseISO,
} from 'date-fns';
import { id } from 'date-fns/locale';
import { ModulScheduleEntryDto } from '@/lib/fetchers/modulScheduleFetcher';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { COURSE_COLORS } from '@/utils/colorUtils';

interface ModulCalendarViewProps {
  rows: ModulScheduleEntryDto[];
}

const DAY_NAMES = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export function ModulCalendarView({ rows }: ModulCalendarViewProps) {
  // Determine date ranges for each module
  // A module runs for 7 days starting from tanggal_mulai
  const moduleRanges = useMemo(() => {
    return rows.reduce((acc: { modul: number; start: Date; end: Date }[], r) => {
      if (r.tanggal_mulai) {
        const start = parseISO(r.tanggal_mulai);
        acc.push({
          modul: r.modul,
          start,
          end: addDays(start, 6), // 7 days inclusive
        });
      }
      return acc;
    }, []).sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [rows]);

  const monthsToRender = useMemo(() => {
    if (moduleRanges.length === 0) return [];
    
    const minDate = moduleRanges[0].start;
    const maxDate = moduleRanges[moduleRanges.length - 1].end;
    
    let current = startOfMonth(minDate);
    const end = startOfMonth(maxDate);
    const months = [];

    while (current <= end) {
      months.push(current);
      current = addMonths(current, 1);
    }

    return months;
  }, [moduleRanges]);

  const getModuleForDay = (date: Date) => {
    // Find the module where the date falls into its 7-day range
    for (const range of moduleRanges) {
      if (date >= range.start && date <= range.end) {
        return range.modul;
      }
    }
    return null;
  };

  if (monthsToRender.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-muted-foreground bg-muted/20 rounded-lg border border-dashed p-8">
        <p className="text-sm">Isi tanggal modul untuk melihat pratinjau kalender.</p>
      </div>
    );
  }



  return (
    <ScrollArea className="h-[calc(100vh-200px)] min-h-[500px] rounded-lg border border-border bg-card/50 shadow-sm backdrop-blur-sm">
      <div className="p-6 space-y-10">
        {monthsToRender.map((month) => {
          const start = startOfWeek(month, { weekStartsOn: 1 });
          const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
          const days = eachDayOfInterval({ start, end });

          return (
            <div key={month.toISOString()} className="space-y-4">
              <h3 className="font-bold text-lg capitalize flex items-center gap-4">
                {format(month, 'MMMM yyyy', { locale: id })}
                <div className="flex-1 h-px bg-border/50"></div>
              </h3>
              
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {DAY_NAMES.map((day) => (
                  <div key={day} className="text-center font-semibold text-xs text-muted-foreground pb-2 uppercase tracking-wide">
                    {day}
                  </div>
                ))}
                
                {days.map((day) => {
                  const isCurrentMonth = isSameMonth(day, month);
                  
                  if (!isCurrentMonth) {
                    return <div key={day.toISOString()} className="aspect-square p-1" />;
                  }

                  const modulNum = getModuleForDay(day);
                  const hexColor = modulNum ? COURSE_COLORS[(modulNum - 1) % COURSE_COLORS.length] : undefined;

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'aspect-square p-1 flex flex-col items-center justify-center rounded-none relative text-sm font-medium transition-all duration-200',
                        modulNum ? 'text-white shadow-sm' : 'bg-transparent hover:bg-muted/50 border border-transparent hover:border-border',
                        modulNum ? 'hover:scale-105 hover:z-10 hover:shadow-md cursor-default' : ''
                      )}
                      style={modulNum ? { backgroundColor: hexColor } : {}}
                      title={modulNum ? `Modul ${modulNum}` : 'Tidak ada modul'}
                    >
                      <span className={cn('z-10', modulNum ? 'font-bold' : '')}>{format(day, 'd')}</span>
                      {modulNum !== null && (
                        <span className="text-[10px] font-bold uppercase tracking-tighter mt-1 opacity-90 leading-none">
                          M{modulNum}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
