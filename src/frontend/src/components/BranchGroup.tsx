import React from 'react';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

interface BranchGroupProps {
  branchName: string;
  employeeCount: number;
  children?: React.ReactNode;
}

const BranchGroup: React.FC<BranchGroupProps> = ({ branchName, employeeCount, children }) => {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-4">
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <BuildingOfficeIcon className="w-4 h-4 text-zinc-400" />
          <h2 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">{branchName}</h2>
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {employeeCount} {employeeCount === 1 ? 'empleado' : 'empleados'}
        </span>
      </div>
      <div className="p-3 space-y-2">
        {children}
      </div>
    </div>
  );
};

export default BranchGroup;
