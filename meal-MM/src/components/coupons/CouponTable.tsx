import { useState } from 'react';
import { Pencil, Copy, CheckCircle2, Ban, Trash2, Ticket } from 'lucide-react';
import { Coupon, MealPlan } from '../../lib/types';
import StatusBadge from '../ui/StatusBadge';
import ActionButton from '../ui/ActionButton';
import EmptyState from '../ui/EmptyState';
import ConfirmDialog from '../ui/ConfirmDialog';

type DisplayStatus = 'Active' | 'Disabled' | 'Expired';

function getDisplayStatus(coupon: Coupon): DisplayStatus {
  const today = new Date(new Date().toISOString().split('T')[0]);
  if (new Date(coupon.valid_until) < today) return 'Expired';
  if (!coupon.active) return 'Disabled';
  return 'Active';
}

function formatDiscount(coupon: Coupon): string {
  return coupon.discount_type === 'percentage'
    ? `${coupon.discount_value}%`
    : `₹${coupon.discount_value.toLocaleString()}`;
}

function getPlanName(coupon: Coupon, mealPlans: MealPlan[]): string {
  if (!coupon.applicable_plan_id) return 'All Plans';
  return mealPlans.find(p => p.id === coupon.applicable_plan_id)?.plan_name ?? 'Unknown Plan';
}

interface CouponTableProps {
  coupons: Coupon[];
  mealPlans: MealPlan[];
  loading: boolean;
  onEdit: (coupon: Coupon) => void;
  onDuplicate: (coupon: Coupon) => void;
  onToggle: (coupon: Coupon) => void;
  onDelete: (coupon: Coupon) => void;
}

type ConfirmAction = { type: 'delete' | 'disable'; coupon: Coupon };

export default function CouponTable({ coupons, mealPlans, loading, onEdit, onDuplicate, onToggle, onDelete }: CouponTableProps) {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);
  const [processing, setProcessing] = useState(false);

  async function handleConfirm() {
    if (!confirmAction) return;
    setProcessing(true);
    if (confirmAction.type === 'delete') onDelete(confirmAction.coupon);
    else onToggle(confirmAction.coupon);
    setProcessing(false);
    setConfirmAction(null);
  }

  return (
    <>
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-4">Coupon</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-4 hidden sm:table-cell">Discount</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-4 hidden md:table-cell">Plan</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-4 hidden lg:table-cell">Redemptions</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-4 hidden lg:table-cell">Remaining</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-4 hidden md:table-cell">Expiry</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-4">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="px-6 py-4"><div className="skeleton h-10" /></td>
                    <td colSpan={7} className="px-4 py-4"><div className="skeleton h-4" /></td>
                  </tr>
                ))
              ) : coupons.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState icon={Ticket} title="No coupons found" description="Create a coupon to get started." />
                  </td>
                </tr>
              ) : coupons.map(coupon => {
                const status = getDisplayStatus(coupon);
                const remaining = coupon.max_total_redemptions === null
                  ? 'Unlimited'
                  : Math.max(coupon.max_total_redemptions - coupon.redeemed_count, 0);
                return (
                  <tr key={coupon.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center flex-shrink-0">
                          <Ticket className="w-4 h-4 text-red-600" aria-hidden="true" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm font-mono">{coupon.code}</p>
                          <p className="text-xs text-gray-500">{coupon.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell text-sm font-semibold text-red-600">{formatDiscount(coupon)}</td>
                    <td className="px-4 py-4 hidden md:table-cell text-sm text-gray-600">{getPlanName(coupon, mealPlans)}</td>
                    <td className="px-4 py-4 hidden lg:table-cell text-sm text-gray-600">{coupon.redeemed_count}</td>
                    <td className="px-4 py-4 hidden lg:table-cell text-sm text-gray-600">{remaining}</td>
                    <td className="px-4 py-4 hidden md:table-cell text-xs text-gray-500">{new Date(coupon.valid_until).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-4">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <ActionButton icon={Pencil} label="Edit" onClick={() => onEdit(coupon)} />
                        <ActionButton icon={Copy} label="Duplicate" onClick={() => onDuplicate(coupon)} />
                        {coupon.active ? (
                          <ActionButton icon={Ban} label="Disable" tone="warning" onClick={() => setConfirmAction({ type: 'disable', coupon })} />
                        ) : (
                          <ActionButton icon={CheckCircle2} label="Enable" tone="success" onClick={() => onToggle(coupon)} />
                        )}
                        <ActionButton icon={Trash2} label="Delete" tone="danger" onClick={() => setConfirmAction({ type: 'delete', coupon })} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmAction?.type === 'delete' ? 'Delete Coupon' : 'Disable Coupon'}
        description={
          confirmAction && (
            <div className="space-y-2">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm font-semibold text-slate-900 font-mono">{confirmAction.coupon.code}</p>
                <p className="text-xs text-gray-500">{confirmAction.coupon.name}</p>
              </div>
              <p>
                {confirmAction.type === 'delete'
                  ? <>This will permanently delete this coupon. <span className="font-semibold text-red-600">This action cannot be undone.</span></>
                  : 'Students will no longer be able to apply this coupon until it is re-enabled.'}
              </p>
            </div>
          )
        }
        confirmLabel={confirmAction?.type === 'delete' ? 'Delete' : 'Disable'}
        danger={confirmAction?.type === 'delete'}
        loading={processing}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />
    </>
  );
}
