'use client';

import React, { useState } from 'react';
import { AlertTriangle, PhoneCall, X, ShieldAlert } from 'lucide-react';

interface Props {
  emergencyContact?: string;
  isTriggered?: boolean;
}

export function EmergencyBanner({ emergencyContact, isTriggered }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed && !isTriggered) return null;

  return (
    <div
      className={`border-b transition-all ${
        isTriggered
          ? 'bg-red-600 text-white border-red-700 animate-pulse-subtle'
          : 'bg-amber-50 text-amber-900 border-amber-200'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 lg:px-8 flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5">
          {isTriggered ? (
            <ShieldAlert className="w-5 h-5 text-white shrink-0 animate-bounce" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          )}
          <div>
            <span className="font-bold">
              {isTriggered ? 'URGENT MEDICAL NOTICE: ' : 'Administrative Support Notice: '}
            </span>
            <span>
              {isTriggered
                ? 'This AI does not diagnose or treat medical emergencies. For acute symptoms, immediately call emergency services or visit the nearest hospital.'
                : 'This platform handles hospital policies, visiting hours, and appointments only. Never use this service for emergency medical care.'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href="tel:911"
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-bold text-xs shadow-sm transition-colors ${
              isTriggered
                ? 'bg-white text-red-700 hover:bg-red-50'
                : 'bg-amber-200 text-amber-900 hover:bg-amber-300'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            {emergencyContact || 'Emergency: 911 / 108'}
          </a>

          {!isTriggered && (
            <button
              onClick={() => setDismissed(true)}
              className="text-amber-700 hover:text-amber-900 p-0.5 rounded"
              title="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
