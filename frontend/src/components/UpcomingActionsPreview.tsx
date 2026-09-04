import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { corporateActionsService } from '../services/api';
import { Coins, Calendar, ArrowRight } from 'lucide-react';

export const UpcomingActionsPreview: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    corporateActionsService.getUpcomingActions()
      .then((res) => {
        if (isMounted && res?.items) {
          // Take top 4 upcoming actions
          setItems(res.items.slice(0, 4));
        }
      })
      .catch((err) => console.error("Error loading upcoming actions preview:", err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 shadow-md hover-lift space-y-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-emerald-500/10 text-emerald-400">
            <Coins size={16} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Upcoming Corporate Actions Calendar
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                NSE
              </span>
            </h3>
          </div>
        </div>
        <Link
          to="/corporate-actions"
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
        >
          <span>View All Calendar</span>
          <ArrowRight size={13} />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item, idx) => {
          const isDiv = item.type === 'dividend';
          return (
            <Link
              key={idx}
              to={`/stock/${item.symbol}`}
              className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all block group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white group-hover:text-emerald-400 transition-colors">
                  {item.symbol}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${
                  isDiv
                    ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                    : 'bg-blue-950/60 text-blue-300 border-blue-800'
                }`}>
                  {isDiv ? `${item.dividend_type || 'Div'}` : 'Buyback'}
                </span>
              </div>

              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-sm font-extrabold font-mono text-slate-100">
                  {isDiv ? item.amount_formatted : item.buyback_price_formatted}
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                  <Calendar size={11} />
                  {item.ex_date}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default UpcomingActionsPreview;
