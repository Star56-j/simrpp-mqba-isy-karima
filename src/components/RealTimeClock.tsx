import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

// Simple Hijri date approximation (no external library needed)
function getHijriDate(date: Date): { day: number; month: string; year: number } {
  // Julian Day Number calculation
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  
  // Convert Gregorian to Julian Day Number
  const jd = Math.floor((1461 * (y + 4800 + Math.floor((m - 14) / 12))) / 4) +
    Math.floor((367 * (m - 2 - 12 * Math.floor((m - 14) / 12))) / 12) -
    Math.floor((3 * Math.floor((y + 4900 + Math.floor((m - 14) / 12)) / 100)) / 4) +
    d - 32075;
  
  // Convert Julian Day Number to Hijri
  const l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  const l2 = l - 10631 * n + 354;
  const j = Math.floor((10985 - l2) / 5316) * Math.floor((50 * l2) / 17719) +
    Math.floor(l2 / 5670) * Math.floor((43 * l2) / 15238);
  const l3 = l2 - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const hijriMonth = Math.floor((24 * l3) / 709);
  const hijriDay = l3 - Math.floor((709 * hijriMonth) / 24);
  const hijriYear = 30 * n + j - 30;

  const hijriMonths = [
    'Muharram', 'Safar', 'Rabiul Awal', 'Rabiul Akhir',
    'Jumadil Awal', 'Jumadil Akhir', 'Rajab', 'Sya\'ban',
    'Ramadhan', 'Syawal', 'Dzulqa\'dah', 'Dzulhijjah'
  ];

  return {
    day: hijriDay,
    month: hijriMonths[hijriMonth - 1] || 'Muharram',
    year: hijriYear
  };
}

export default function RealTimeClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatterTime = new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const formatterDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const hijri = getHijriDate(time);

  return (
    <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md border border-amber-400/20 px-4 py-3 rounded-xl shadow-lg shadow-indigo-950/20">
      <div className="p-2 bg-amber-500/20 rounded-lg">
        <Clock className="w-5 h-5 text-amber-300" />
      </div>
      <div>
        <div className="text-xl font-black text-white tracking-wider leading-none">
          {formatterTime.format(time).replace(/\./g, ':')}
        </div>
        <div className="text-[10px] font-semibold text-indigo-200 uppercase tracking-widest mt-1">
          {formatterDate.format(time)}
        </div>
        <div className="text-[9px] font-bold text-amber-400/80 tracking-wider mt-0.5">
          {hijri.day} {hijri.month} {hijri.year} H
        </div>
      </div>
    </div>
  );
}
