import { LightWavesBackground } from '@/components/login/LightWavesBackground';
import { LoginForm } from '@/components/login/LoginForm';
import Image from 'next/image';

export default function Page() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center">
      <div className="w-full h-dvh relative">
        <LightWavesBackground />
        <div className="flex flex-col h-full">
          <h2 className="w-full p-6 text-xl font-semibold">Infotmatics Laboratory</h2>
          <div className=" h-full flex items-center justify-center">
            <div className="size-52 relative p-12 rounded-lg">
              <Image
                src="/iflab.png"
                alt="Infotmatics Laboratory"
                fill
                className="object-contain"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="w-full h-dvh bg-background flex items-center justify-center">
        <div className="w-[50%]">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
