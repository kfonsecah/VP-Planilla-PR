"use client";

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#E7DCC1] p-6">
      <div className="max-w-3xl w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <Image src="/404notfound.png" alt="Recurso no encontrado" width={200} height={200} />
        </div>
        <h1 className="text-2xl font-semibold text-[#3B4D36] mb-2">Página no encontrada</h1>
        <p className="text-[#5D4E37] mb-6">Lo sentimos — no pudimos encontrar el recurso que buscabas (404).</p>
        <div className="flex items-center justify-center gap-4">
          <Link href="/pages/main" className="px-4 py-2 bg-[#6F7153] text-white rounded-lg hover:bg-[#5D614A] transition-colors">Ir al dashboard</Link>
          <Link href="/pages/auth" className="px-4 py-2 border border-[#D2B48C] text-[#3B4D36] rounded-lg hover:bg-[#F5F1E8] transition-colors">Volver al inicio de sesión</Link>
        </div>
      </div>
    </div>
  );
}
