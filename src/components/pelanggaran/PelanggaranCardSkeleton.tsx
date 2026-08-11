import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardFooter } from '@/components/ui/card';

export function PelanggaranCardSkeleton() {
  return (
    <Card className="h-full min-h-[142px] 2xl:min-h-[160px] flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start mb-3">
          <Skeleton className="h-4 w-12 rounded-md mb-1" />
          <Skeleton className="h-[22px] w-[60px] rounded-full shrink-0" />
        </div>
        <Skeleton className="h-6 2xl:h-7 w-3/4 rounded-md" />
      </CardHeader>
      
      <CardFooter className="mt-auto flex items-center justify-between pt-4 border-t border-dashed">
        <div className="flex items-baseline gap-1.5">
          <Skeleton className="h-8 2xl:h-10 w-8" />
          <Skeleton className="h-3 2xl:h-3.5 w-20" />
        </div>
        <Skeleton className="h-9 w-[76px] rounded-md" />
      </CardFooter>
    </Card>
  );
}
