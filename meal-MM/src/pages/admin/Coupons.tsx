import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import {
  getCoupons,
  deleteCoupon,
  toggleCoupon,
  duplicateCoupon,
} from '../../lib/couponService';
import { Coupon, MealPlan } from '../../lib/types';
import CouponStats from '../../components/coupons/CouponStats';
import CouponTable from '../../components/coupons/CouponTable';
import CouponDialog, { CouponDialogMode } from '../../components/coupons/CouponDialog';
import PageHeader from '../../components/ui/PageHeader';
import TableToolbar from '../../components/ui/TableToolbar';

type StatusFilter = 'all' | 'active' | 'disabled' | 'expired';

function isExpired(coupon: Coupon): boolean {
  const today = new Date(new Date().toISOString().split('T')[0]);
  return new Date(coupon.valid_until) < today;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [loading, setLoading] = useState(true);
  const [statsVersion, setStatsVersion] = useState(0);
  const [dialog, setDialog] = useState<{ mode: CouponDialogMode; coupon: Coupon | null } | null>(null);

  useEffect(() => {
    loadCoupons();
    loadMealPlans();
  }, []);

  async function loadCoupons() {
    setLoading(true);
    const res = await getCoupons();
    if (!res.success) {
      toast.error(res.message);
    } else {
      setCoupons(res.data ?? []);
    }
    setLoading(false);
  }

  async function loadMealPlans() {
    const { data, error } = await supabase.from('meal_plans').select('*').order('plan_name');
    if (error) {
      toast.error(error.message);
      return;
    }
    setMealPlans(data ?? []);
  }

  function refreshAll() {
    loadCoupons();
    setStatsVersion(v => v + 1);
  }

  const filtered = coupons.filter(c => {
    const matchesSearch = !search ||
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.name.toLowerCase().includes(search.toLowerCase());

    const expired = isExpired(c);
    const matchesFilter =
      filter === 'all' ? true :
      filter === 'expired' ? expired :
      filter === 'active' ? c.active && !expired :
      !c.active;

    return matchesSearch && matchesFilter;
  });

  function openCreate() {
    setDialog({ mode: 'create', coupon: null });
  }

  function openEdit(coupon: Coupon) {
    setDialog({ mode: 'edit', coupon });
  }

  async function openDuplicate(coupon: Coupon) {
    const res = await duplicateCoupon(coupon.id);
    if (!res.success || !res.data) {
      toast.error(res.message);
      return;
    }
    setDialog({ mode: 'duplicate', coupon: res.data });
  }

  async function handleToggle(coupon: Coupon) {
    const res = await toggleCoupon(coupon.id, coupon.active);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success(res.message);
    refreshAll();
  }

  async function handleDelete(coupon: Coupon) {
    const res = await deleteCoupon(coupon.id);
    if (!res.success) {
      toast.error(res.message);
      return;
    }
    toast.success(res.message);
    refreshAll();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupons"
        subtitle={`${coupons.length} coupons configured`}
        actions={
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Coupon
          </button>
        }
      />

      <CouponStats refreshTrigger={statsVersion} />

      <TableToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by coupon code or name..."
        filters={[
          { value: 'all', label: 'All' },
          { value: 'active', label: 'Active' },
          { value: 'disabled', label: 'Disabled' },
          { value: 'expired', label: 'Expired' },
        ]}
        activeFilter={filter}
        onFilterChange={setFilter}
      />

      <CouponTable
        coupons={filtered}
        mealPlans={mealPlans}
        loading={loading}
        onEdit={openEdit}
        onDuplicate={openDuplicate}
        onToggle={handleToggle}
        onDelete={handleDelete}
      />

      {dialog && (
        <CouponDialog
          mode={dialog.mode}
          coupon={dialog.coupon}
          mealPlans={mealPlans}
          onClose={() => setDialog(null)}
          onSaved={refreshAll}
        />
      )}
    </div>
  );
}
