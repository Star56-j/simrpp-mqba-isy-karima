import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

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

  return (
    <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-3 rounded-xl">
      <div className="p-2 bg-indigo-500/30 rounded-lg">
        <Clock className="w-5 h-5 text-indigo-100" />
      </div>
      <div>
        <div className="text-xl font-black text-white tracking-wider leading-none">
          {formatterTime.format(time).replace(/\./g, ':')}
        </div>
        <div className="text-[10px] font-semibold text-indigo-200 uppercase tracking-widest mt-1">
          {formatterDate.format(time)}
        </div>
      </div>
    </div>
  );
}
