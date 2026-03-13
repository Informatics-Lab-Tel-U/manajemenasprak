import { Suspense } from 'react';
import { LightWavesBackground } from '@/components/login/LightWavesBackground';
import { LoginForm } from '@/components/login/LoginForm';
import Image from 'next/image';

export default function Page() {
  return (
    <div className="flex flex-col md:flex-row min-h-svh w-full ">
      {/* Left panel (Branding) */}
      <div className="w-full md:w-3/5 lg:w-2/3 flex-1 md:h-dvh relative">
        <LightWavesBackground />
        <div className="flex flex-col h-full absolute inset-0">
          <h2 className="w-full p-6 text-xl font-semibold absolute top-0 left-0">
            Informatics Laboratory
          </h2>
          <div className="h-full flex items-center justify-center mt-8 md:mt-0">
            <div className="size-32 md:size-52 relative p-4 rounded-lg">
              <Image
                src="/iflab.png"
                alt="Informatics Laboratory"
                fill
                className="object-contain drop-shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Right panel (Form) */}
      <div className="w-full md:w-2/5 lg:w-1/3 shrink-0 bg-background flex flex-col justify-center items-center py-8 z-10 rounded-t-3xl md:rounded-none md:h-dvh shadow-[0_-10px_40px_rgba(0,0,0,0.1)] md:shadow-none">
        <div className="p-6 w-full max-w-md lg:w-[80%]">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
