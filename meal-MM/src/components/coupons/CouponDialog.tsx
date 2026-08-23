import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { toast } from 'sonner';
import { createCoupon, updateCoupon } from '../../lib/couponService';
import { Coupon, CouponFormValues, MealPlan } from '../../lib/types';
import CouponForm, { EMPTY_COUPON_FORM, CouponFormErrors, validateCouponForm } from './CouponForm';
import Modal from '../ui/Modal';

export type CouponDialogMode = 'create' | 'edit' | 'duplicate';

interface CouponDialogProps {
  mode: CouponDialogMode;
  coupon: Coupon | null;
  mealPlans: MealPlan[];
  onClose: () => void;
  onSaved: () => void;
}

function couponToFormValues(coupon: Coupon): CouponFormValues {
  return {
    code: coupon.code,
    name: coupon.name,
    description: coupon.description ?? '',
    discount_type: coupon.discount_type,
    discount_value: String(coupon.discount_value),
    maximum_discount: coupon.maximum_discount === null ? '' : String(coupon.maximum_discount),
    minimum_order_amount: String(coupon.minimum_order_amount),
    applicable_plan_id: coupon.applicable_plan_id ?? '',
    valid_from: coupon.valid_from,
    valid_until: coupon.valid_until,
    max_total_redemptions: coupon.max_total_redemptions === null ? '' : String(coupon.max_total_redemptions),
    max_redemptions_per_student: coupon.max_redemptions_per_student === null ? '' : String(coupon.max_redemptions_per_student),
    active: coupon.active,
  };
}

const TITLES: Record<CouponDialogMode, string> = {
  create: 'Create Coupon',
  edit: 'Edit Coupon',
  duplicate: 'Duplicate Coupon',
};

export default function CouponDialog({ mode, coupon, mealPlans, onClose, onSaved }: CouponDialogProps) {
  const [values, setValues] = useState<CouponFormValues>(coupon ? couponToFormValues(coupon) : EMPTY_COUPON_FORM);
  const [errors, setErrors] = useState<CouponFormErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(coupon ? couponToFormValues(coupon) : EMPTY_COUPON_FORM);
    setErrors({});
  }, [mode, coupon]);

  async function handleSubmit() {
    const validationErrors = validateCouponForm(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error('Please fix the highlighted fields');
      return;
    }

    setSaving(true);
    const res = mode === 'edit' && coupon?.id
      ? await updateCoupon(coupon.id, values)
      : await createCoupon(values);
    setSaving(false);

    if (!res.success) {
      toast.error(res.message);
      return;
    }

    toast.success(res.message);
    onSaved();
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={TITLES[mode]} maxWidth="max-w-2xl">
      <CouponForm values={values} errors={errors} onChange={setValues} mealPlans={mealPlans} disabled={saving} />

      <div className="flex gap-3 mt-6">
        <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
        <button onClick={handleSubmit} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
          {mode === 'edit' ? 'Save Changes' : 'Create Coupon'}
        </button>
      </div>
    </Modal>
  );
}
