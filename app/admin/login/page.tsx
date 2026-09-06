import { Suspense } from 'react';
import Logo from '@/components/Logo';
import LoginForm from '@/components/admin/LoginForm';

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-paper px-6 safe-x">
      <Logo variant="black" size={44} className="mb-6" />
      <h1 className="mb-8 font-serif text-2xl text-ink">Studio Sign In</h1>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
