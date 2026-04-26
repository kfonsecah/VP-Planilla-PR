import { redirect } from 'next/navigation';

export default function PayrollCalculateRedirectPage() {
  redirect('/pages/payroll/wizard');
}
