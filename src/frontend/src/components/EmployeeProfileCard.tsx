'use client';

import React from 'react';

export interface EmployeeProfileCardProps {
  name: string;
  position: string;
  id: string;
  phone: string;
  status: string;
}

// Client Component
const EmployeeProfileCard: React.FC<EmployeeProfileCardProps> = ({ name, position, id, phone, status }) => {
  return (
    <div className="bg-[#FCF1D5] p-4 rounded-lg min-w-[220px] mb-4">
      <div className="mb-1 text-lg font-bold text-black">{name}</div>
      <div className="text-[#D9C38B] text-sm mb-1">{position}</div>
      <div className="text-[#D9C38B] text-sm mb-1">{id}</div>
      <div className="text-[#D9C38B] text-sm mb-1">{phone}</div>
      <span className="bg-[#3B4D36]/43 text-[#3B4D36] px-2 py-1 rounded-full text-xs mt-2">{status}</span>
    </div>
  );
};

export default EmployeeProfileCard;
