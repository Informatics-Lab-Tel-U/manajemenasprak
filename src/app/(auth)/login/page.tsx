import { Suspense } from 'react';
import { AuthBrandingPanel } from '@/components/auth/AuthBrandingPanel';
import { LoginForm } from '@/components/login/LoginForm';
import packageInfo from '../../../../package.json';

export default function Page() {
  return (
    <div className="relative flex flex-col md:flex-row min-h-svh w-full">
      <AuthBrandingPanel />

      {/* Right panel (Form) */}
      <div className="w-full md:w-[48%] lg:w-[40%] shrink-0 bg-background flex flex-col justify-center items-center py-8 z-10 rounded-t-3xl md:rounded-none md:h-dvh shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none">
        <div className="p-6 w-full max-w-md lg:w-[80%]">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 md:bottom-6 md:left-8 md:right-auto z-50 text-[10px] md:text-xs font-mono font-semibold text-muted-foreground/50 pointer-events-none">
        v{packageInfo.version}
      </div>
    </div>
  );
}
