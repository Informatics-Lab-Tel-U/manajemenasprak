import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface TableSkeletonProps {
  columnCount: number;
  rowCount?: number;
  columnWidths?: string[];
  hasActions?: boolean;
}

export function TableSkeleton({
  columnCount,
  rowCount = 10,
  columnWidths = [],
  hasActions = true,
}: TableSkeletonProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: columnCount }).map((_, i) => (
              <TableHead key={i} style={{ width: columnWidths[i] }}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
            {hasActions && <TableHead className="text-right w-20">Aksi</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: rowCount }).map((_, i) => (
            <TableRow key={i}>
              {Array.from({ length: columnCount }).map((_, j) => (
                <TableCell key={j}>
                  <Skeleton className="h-5 w-full max-w-[150px]" />
                </TableCell>
              ))}
              {hasActions && (
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
