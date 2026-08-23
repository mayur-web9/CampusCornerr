import { useEffect, useState } from 'react';
import { Ticket, BadgeCheck, Ban, CalendarX, Users, IndianRupee } from 'lucide-react';
import { getCouponStatistics } from '../../lib/couponService';
import { CouponStatistics } from '../../lib/types';
import StatCard from '../ui/StatCard';

const EMPTY_STATS: CouponStatistics = {
  totalCoupons: 0,
  activeCoupons: 0,
  disabledCoupons: 0,
  expiredCoupons: 0,
  redeemedCoupons: 0,
  discountGiven: 0,
};

interface CouponStatsProps {
  refreshTrigger?: number;
}

export default function CouponStats({ refreshTrigger }: CouponStatsProps) {
  const [stats, setStats] = useState<CouponStatistics>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [refreshTrigger]);

  async function loadStats() {
    setLoading(true);
    const res = await getCouponStatistics();
    if (res.success && res.data) setStats(res.data);
    setLoading(false);
  }

  const cards = [
    { label: 'Total Coupons', value: stats.totalCoupons, icon: Ticket, iconBg: 'bg-blue-50', iconColor: 'text-blue-600' },
    { label: 'Active Coupons', value: stats.activeCoupons, icon: BadgeCheck, iconBg: 'bg-green-50', iconColor: 'text-green-600' },
    { label: 'Disabled Coupons', value: stats.disabledCoupons, icon: Ban, iconBg: 'bg-gray-100', iconColor: 'text-gray-600' },
    { label: 'Expired Coupons', value: stats.expiredCoupons, icon: CalendarX, iconBg: 'bg-red-50', iconColor: 'text-red-600' },
    { label: 'Redeemed Coupons', value: stats.redeemedCoupons, icon: Users, iconBg: 'bg-purple-50', iconColor: 'text-purple-600' },
    { label: 'Discount Given', value: `₹${stats.discountGiven.toLocaleString()}`, icon: IndianRupee, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600' },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
      {cards.map(card => (
        <StatCard key={card.label} label={card.label} value={card.value} icon={card.icon} iconBg={card.iconBg} iconColor={card.iconColor} />
      ))}
    </div>
  );
}
