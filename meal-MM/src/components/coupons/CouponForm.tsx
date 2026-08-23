import { CouponFormValues, MealPlan } from '../../lib/types';

export const EMPTY_COUPON_FORM: CouponFormValues = {
  code: '',
  name: '',
  description: '',
  discount_type: 'percentage',
  discount_value: '',
  maximum_discount: '',
  minimum_order_amount: '',
  applicable_plan_id: '',
  valid_from: new Date().toISOString().split('T')[0],
  valid_until: '',
  max_total_redemptions: '',
  max_redemptions_per_student: '',
  active: true,
};

export type CouponFormErrors = Partial<Record<keyof CouponFormValues, string>>;

export function validateCouponForm(values: CouponFormValues): CouponFormErrors {
  const errors: CouponFormErrors = {};

  if (!values.code.trim()) errors.code = 'Coupon code is required';
  if (!values.name.trim()) errors.name = 'Coupon name is required';

  if (values.discount_value === '' || Number.isNaN(Number(values.discount_value))) {
    errors.discount_value = 'Discount value is required';
  } else {
    const val = Number(values.discount_value);
    if (val <= 0) errors.discount_value = 'Discount value must be positive';
    else if (values.discount_type === 'percentage' && (val < 1 || val > 100)) {
      errors.discount_value = 'Percentage discount must be between 1 and 100';
    }
  }

  if (values.maximum_discount !== '' && Number(values.maximum_discount) <= 0) {
    errors.maximum_discount = 'Maximum discount must be positive';
  }

  if (values.minimum_order_amount !== '' && Number(values.minimum_order_amount) < 0) {
    errors.minimum_order_amount = 'Minimum order amount cannot be negative';
  }

  if (!values.valid_from) errors.valid_from = 'Valid from date is required';
  if (!values.valid_until) errors.valid_until = 'Valid until date is required';
  if (values.valid_from && values.valid_until && values.valid_until < values.valid_from) {
    errors.valid_until = 'End date must be after start date';
  }

  if (values.max_total_redemptions !== '' && Number(values.max_total_redemptions) <= 0) {
    errors.max_total_redemptions = 'Must be a positive number';
  }

  if (values.max_redemptions_per_student !== '' && Number(values.max_redemptions_per_student) <= 0) {
    errors.max_redemptions_per_student = 'Must be a positive number';
  }

  return errors;
}

interface CouponFormProps {
  values: CouponFormValues;
  errors: CouponFormErrors;
  onChange: (values: CouponFormValues) => void;
  mealPlans: MealPlan[];
  disabled?: boolean;
}

export default function CouponForm({ values, errors, onChange, mealPlans, disabled }: CouponFormProps) {
  function setField<K extends keyof CouponFormValues>(key: K, value: CouponFormValues[K]) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
          <input
            type="text"
            value={values.code}
            onChange={e => setField('code', e.target.value.toUpperCase())}
            placeholder="e.g., WELCOME50"
            className="input-field font-mono"
            disabled={disabled}
          />
          {errors.code && <p className="text-xs text-red-600 mt-1">{errors.code}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Name *</label>
          <input
            type="text"
            value={values.name}
            onChange={e => setField('name', e.target.value)}
            placeholder="e.g., Welcome Offer"
            className="input-field"
            disabled={disabled}
          />
          {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={values.description}
          onChange={e => setField('description', e.target.value)}
          placeholder="Optional description shown internally"
          rows={2}
          className="input-field resize-none"
          disabled={disabled}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type *</label>
          <select
            value={values.discount_type}
            onChange={e => setField('discount_type', e.target.value as CouponFormValues['discount_type'])}
            className="input-field"
            disabled={disabled}
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Discount Value * {values.discount_type === 'percentage' ? '(%)' : '(₹)'}
          </label>
          <input
            type="number"
            min={0}
            value={values.discount_value}
            onChange={e => setField('discount_value', e.target.value)}
            placeholder={values.discount_type === 'percentage' ? '1-100' : 'e.g., 200'}
            className="input-field"
            disabled={disabled}
          />
          {errors.discount_value && <p className="text-xs text-red-600 mt-1">{errors.discount_value}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Discount (₹)</label>
          <input
            type="number"
            min={0}
            value={values.maximum_discount}
            onChange={e => setField('maximum_discount', e.target.value)}
            placeholder="No cap"
            className="input-field"
            disabled={disabled}
          />
          {errors.maximum_discount && <p className="text-xs text-red-600 mt-1">{errors.maximum_discount}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Order Amount (₹)</label>
          <input
            type="number"
            min={0}
            value={values.minimum_order_amount}
            onChange={e => setField('minimum_order_amount', e.target.value)}
            placeholder="0"
            className="input-field"
            disabled={disabled}
          />
          {errors.minimum_order_amount && <p className="text-xs text-red-600 mt-1">{errors.minimum_order_amount}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Applicable Meal Plan</label>
          <select
            value={values.applicable_plan_id}
            onChange={e => setField('applicable_plan_id', e.target.value)}
            className="input-field"
            disabled={disabled}
          >
            <option value="">All Plans</option>
            {mealPlans.map(plan => (
              <option key={plan.id} value={plan.id}>{plan.plan_name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valid From *</label>
          <input
            type="date"
            value={values.valid_from}
            onChange={e => setField('valid_from', e.target.value)}
            className="input-field"
            disabled={disabled}
          />
          {errors.valid_from && <p className="text-xs text-red-600 mt-1">{errors.valid_from}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until *</label>
          <input
            type="date"
            value={values.valid_until}
            onChange={e => setField('valid_until', e.target.value)}
            className="input-field"
            disabled={disabled}
          />
          {errors.valid_until && <p className="text-xs text-red-600 mt-1">{errors.valid_until}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Total Redemptions</label>
          <input
            type="number"
            min={1}
            value={values.max_total_redemptions}
            onChange={e => setField('max_total_redemptions', e.target.value)}
            placeholder="Unlimited"
            className="input-field"
            disabled={disabled}
          />
          {errors.max_total_redemptions && <p className="text-xs text-red-600 mt-1">{errors.max_total_redemptions}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Redemptions Per Student</label>
          <input
            type="number"
            min={1}
            value={values.max_redemptions_per_student}
            onChange={e => setField('max_redemptions_per_student', e.target.value)}
            placeholder="Unlimited"
            className="input-field"
            disabled={disabled}
          />
          {errors.max_redemptions_per_student && <p className="text-xs text-red-600 mt-1">{errors.max_redemptions_per_student}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
        <select
          value={values.active ? 'active' : 'inactive'}
          onChange={e => setField('active', e.target.value === 'active')}
          className="input-field"
          disabled={disabled}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
    </div>
  );
}
