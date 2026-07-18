import React from "react";

const GOLD = "#D49A44";

type IconProps = { className?: string; size?: number };

const s = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

export const AlertCircle = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <circle cx="12" cy="16" r="1" fill={GOLD} stroke="none" />
  </svg>
);

export const Archive = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <rect x="2" y="4" width="20" height="4" rx="1" />
    <path d="M4 8v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
    <line x1="10" y1="12" x2="14" y2="12" />
    <rect x="9" y="14" width="6" height="2" fill={GOLD} stroke="none" rx="1" />
  </svg>
);

export const ArrowLeft = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <line x1="20" y1="12" x2="4" y2="12" />
    <polyline points="10,18 4,12 10,6" />
  </svg>
);

export const ArrowRight = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <line x1="4" y1="12" x2="20" y2="12" />
    <polyline points="14,6 20,12 14,18" />
  </svg>
);

export const Banknote = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="12" r="1" fill={GOLD} stroke="none" />
    <line x1="6" y1="8" x2="6" y2="8" />
    <line x1="18" y1="16" x2="18" y2="16" />
  </svg>
);

export const Bath = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M3 12h18l-2 8H5l-2-8z" />
    <path d="M7 12V8a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v1" />
    <rect x="6" y="15" width="12" height="1" fill={GOLD} stroke="none" />
  </svg>
);

export const Bed = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M2 4v16" />
    <path d="M22 4v16" />
    <rect x="2" y="8" width="20" height="8" rx="2" />
    <rect x="6" y="10" width="6" height="4" rx="1" />
    <rect x="6" y="10" width="6" height="1" fill={GOLD} stroke="none" />
    <line x1="2" y1="20" x2="22" y2="20" />
  </svg>
);

export const Bell = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    <circle cx="12" cy="5" r="1.5" fill={GOLD} stroke="none" />
  </svg>
);

export const Briefcase = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <rect x="6" y="7" width="12" height="4" />
    <rect x="10" y="12" width="4" height="2" fill={GOLD} stroke="none" rx="1" />
    <line x1="9" y1="3" x2="15" y2="3" />
    <line x1="12" y1="3" x2="12" y2="7" />
  </svg>
);

export const Building2 = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <rect x="2" y="6" width="20" height="16" rx="1" />
    <rect x="6" y="10" width="3" height="3" rx="0.5" />
    <rect x="15" y="10" width="3" height="3" rx="0.5" />
    <rect x="6" y="16" width="3" height="3" rx="0.5" />
    <rect x="15" y="16" width="3" height="3" rx="0.5" />
    <rect x="11" y="10" width="2" height="9" fill={GOLD} stroke="none" rx="0.5" />
    <path d="M6 6V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
  </svg>
);

export const Camera = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <rect x="2" y="5" width="20" height="16" rx="3" />
    <circle cx="12" cy="13" r="5" />
    <circle cx="12" cy="13" r="2" fill={GOLD} stroke="none" />
    <line x1="17" y1="5" x2="15" y2="3" />
    <line x1="7" y1="5" x2="9" y2="3" />
  </svg>
);

export const Check = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <polyline points="4,12 10,18 20,6" />
  </svg>
);

export const CheckCheck = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <polyline points="2,12 7,17 13,7" />
    <polyline points="13,12 18,17 22,10" />
  </svg>
);

export const CheckCircle = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="8,12 11,15 16,9" />
    <circle cx="12" cy="12" r="3" fill={GOLD} stroke="none" />
  </svg>
);

export const ChevronLeft = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <polyline points="15,18 9,12 15,6" />
  </svg>
);

export const ChevronRight = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <polyline points="9,6 15,12 9,18" />
  </svg>
);

export const Clock = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
    <circle cx="12" cy="12" r="2" fill={GOLD} stroke="none" />
  </svg>
);

export const Copy = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <rect x="9" y="9" width="13" height="13" rx="1" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    <rect x="12" y="14" width="7" height="3" fill={GOLD} stroke="none" rx="0.5" />
  </svg>
);

export const DollarSign = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <line x1="12" y1="2" x2="12" y2="22" />
    <path d="M17 7c0-2.5-2.5-4-5-4S7 4.5 7 7c0 2.5 2.5 4 5 4s5 1.5 5 4-2.5 4-5 4-5-1.5-5-4" />
  </svg>
);

export const Download = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7,10 12,15 17,10" />
    <line x1="12" y1="15" x2="12" y2="3" />
    <rect x="10" y="3" width="4" height="2" fill={GOLD} stroke="none" rx="0.5" />
  </svg>
);

export const Expand = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <polyline points="15,3 21,3 21,9" />
    <polyline points="9,21 3,21 3,15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

export const ExternalLink = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15,3 21,3 21,9" />
    <line x1="10" y1="14" x2="21" y2="3" />
    <rect x="14" y="3" width="4" height="4" fill={GOLD} stroke="none" rx="0.5" />
  </svg>
);

export const Eye = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
    <circle cx="12" cy="12" r="1" fill={GOLD} stroke="none" />
  </svg>
);

export const EyeOff = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <line x1="3" y1="3" x2="21" y2="21" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const FileText = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="14" y2="17" />
    <rect x="8" y="11" width="4" height="1.5" fill={GOLD} stroke="none" rx="0.3" />
  </svg>
);

export const Globe = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <circle cx="12" cy="12" r="10" />
    <ellipse cx="12" cy="12" rx="4" ry="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <circle cx="12" cy="12" r="2" fill={GOLD} stroke="none" />
  </svg>
);

export const Handshake = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M3 11h3l3-6 3 4 3-4 3 6h3v6h-3l-3 3-3-3H6l-3-3z" />
    <path d="M6 11v6" />
    <path d="M18 11v6" />
    <rect x="9" y="13" width="6" height="2" fill={GOLD} stroke="none" rx="1" />
  </svg>
);

export const Home = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M3 10l9-8 9 8v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z" />
    <rect x="9" y="14" width="6" height="6" />
    <rect x="11" y="15" width="2" height="3" fill={GOLD} stroke="none" rx="0.5" />
  </svg>
);

export const ImageIcon = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <rect x="2" y="2" width="20" height="20" rx="2" />
    <circle cx="8" cy="8" r="2" />
    <path d="M22 17l-5-5-4 4-3-3-6 6" />
    <polygon points="22,17 17,12 13,16 10,13 4,19" fill={GOLD} stroke="none" />
  </svg>
);

export const Key = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <circle cx="8" cy="15" r="5" />
    <line x1="12" y1="11" x2="22" y2="1" />
    <line x1="16" y1="7" x2="19" y2="4" />
    <rect x="18" y="2" width="3" height="5" fill={GOLD} stroke="none" rx="0.5" />
  </svg>
);

export const LayoutDashboard = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
    <rect x="16" y="5" width="3" height="1.5" fill={GOLD} stroke="none" rx="0.3" />
  </svg>
);

export const Link = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    <rect x="10" y="10" width="4" height="4" fill={GOLD} stroke="none" rx="0.5" />
  </svg>
);

export const Loader2 = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className + " animate-spin"}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    <circle cx="12" cy="12" r="2" fill={GOLD} stroke="none" />
  </svg>
);

export const Lock = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    <circle cx="12" cy="16" r="1.5" fill={GOLD} stroke="none" />
  </svg>
);

export const LogOut = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16,17 21,12 16,7" />
    <line x1="21" y1="12" x2="9" y2="12" />
    <rect x="13" y="11" width="5" height="2" fill={GOLD} stroke="none" rx="0.5" />
  </svg>
);

export const Mail = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 4L12 13 2 4" />
    <rect x="10" y="10" width="4" height="3" fill={GOLD} stroke="none" rx="0.5" />
  </svg>
);

export const MapPin = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
    <circle cx="12" cy="10" r="1.5" fill={GOLD} stroke="none" />
  </svg>
);

export const Maximize2 = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <polyline points="15,3 21,3 21,9" />
    <polyline points="9,21 3,21 3,15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

export const MessageCircle = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M21 11.5a8.5 8.5 0 0 1-8.5 8.5H6l-3 3V11.5a8.5 8.5 0 1 1 18 0z" />
    <circle cx="10" cy="11.5" r="1" fill={GOLD} stroke="none" />
    <circle cx="14" cy="11.5" r="1" fill={GOLD} stroke="none" />
  </svg>
);

export const Phone = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    <rect x="16" y="5" width="6" height="2" fill={GOLD} stroke="none" rx="0.5" />
  </svg>
);

export const Plus = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const RotateCw = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <polyline points="23,4 23,10 17,10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    <circle cx="12" cy="12" r="2" fill={GOLD} stroke="none" />
  </svg>
);

export const Save = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17,21 17,13 7,13 7,21" />
    <polyline points="7,3 7,8 15,8" />
    <rect x="9" y="15" width="6" height="3" fill={GOLD} stroke="none" rx="0.5" />
  </svg>
);

export const Search = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <circle cx="11" cy="11" r="3" fill={GOLD} stroke="none" />
  </svg>
);

export const Shield = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9,12 11,14 15,10" />
  </svg>
);

export const ShieldAlert = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <circle cx="12" cy="16" r="1" fill={GOLD} stroke="none" />
  </svg>
);

export const ShieldX = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="9" y1="10" x2="15" y2="16" />
    <line x1="15" y1="10" x2="9" y2="16" />
    <rect x="11" y="11" width="2" height="2" fill={GOLD} stroke="none" />
  </svg>
);

export const SlidersHorizontal = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <line x1="4" y1="7" x2="20" y2="7" />
    <line x1="4" y1="17" x2="20" y2="17" />
    <circle cx="8" cy="7" r="2" />
    <circle cx="16" cy="17" r="2" />
    <circle cx="8" cy="7" r="1" fill={GOLD} stroke="none" />
    <circle cx="16" cy="17" r="1" fill={GOLD} stroke="none" />
  </svg>
);

export const Sparkles = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    <path d="M18 16l1 2 2 1-2 1-1 2-1-2-2-1 2-1 1-2z" />
    <circle cx="6" cy="18" r="0.5" fill={GOLD} stroke="none" />
  </svg>
);

export const Star = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    <polygon points="12,5 13.8,9.5 18.5,10.2 15.2,13.4 16.1,18 12,15.5 7.9,18 8.8,13.4 5.5,10.2 10.2,9.5" fill={GOLD} stroke="none" />
  </svg>
);

export const Tent = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M12 2L3 21h18L12 2z" />
    <line x1="12" y1="2" x2="12" y2="21" />
    <rect x="9" y="14" width="6" height="3" fill={GOLD} stroke="none" rx="0.5" />
  </svg>
);

export const TreePine = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M12 2L6 12h3l-4 8h14l-4-8h3L12 2z" />
    <line x1="12" y1="12" x2="12" y2="22" />
    <circle cx="12" cy="6" r="1.5" fill={GOLD} stroke="none" />
  </svg>
);

export const Trash2 = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <polyline points="3,6 5,6 21,6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
    <rect x="9" y="10" width="6" height="1.5" fill={GOLD} stroke="none" rx="0.3" />
  </svg>
);

export const Upload = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17,8 12,3 7,8" />
    <line x1="12" y1="3" x2="12" y2="15" />
    <rect x="10" y="11" width="4" height="2" fill={GOLD} stroke="none" rx="0.5" />
  </svg>
);

export const User = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <circle cx="12" cy="8" r="5" />
    <path d="M3 21v-2a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v2" />
    <circle cx="12" cy="8" r="2" fill={GOLD} stroke="none" />
  </svg>
);

export const Users = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <circle cx="9" cy="7" r="4" />
    <circle cx="17" cy="9" r="3" />
    <path d="M1 20v-1a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v1" />
    <circle cx="9" cy="7" r="1.5" fill={GOLD} stroke="none" />
    <circle cx="17" cy="9" r="1" fill={GOLD} stroke="none" />
  </svg>
);

export const Wallet = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <rect x="6" y="10" width="12" height="4" rx="1" />
    <circle cx="16" cy="12" r="1.5" fill={GOLD} stroke="none" />
    <line x1="1" y1="8" x2="23" y2="8" />
  </svg>
);

export const Wrench = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    <rect x="14" y="14" width="3" height="2" fill={GOLD} stroke="none" rx="0.5" />
  </svg>
);

export const X = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const XCircle = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
    <circle cx="12" cy="12" r="3" fill={GOLD} stroke="none" />
  </svg>
);

export const ZoomIn = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" />
    <line x1="8" y1="11" x2="14" y2="11" />
    <circle cx="11" cy="11" r="3" fill={GOLD} stroke="none" />
  </svg>
);

export const ZoomOut = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="8" y1="11" x2="14" y2="11" />
    <circle cx="11" cy="11" r="3" fill={GOLD} stroke="none" />
  </svg>
);

export const Menu = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="18" x2="20" y2="18" />
    <rect x="7" y="10" width="10" height="4" fill={GOLD} stroke="none" rx="0.5" />
  </svg>
);

export const Settings = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    <circle cx="12" cy="12" r="1.5" fill={GOLD} stroke="none" />
  </svg>
);

export const UserCheck = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <circle cx="10" cy="8" r="5" />
    <path d="M2 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    <polyline points="16,11 18,13 22,9" />
    <circle cx="10" cy="8" r="2" fill={GOLD} stroke="none" />
  </svg>
);

export const Activity = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
    <circle cx="12" cy="12" r="1.5" fill={GOLD} stroke="none" />
  </svg>
);

export const ArrowDown = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <line x1="12" y1="4" x2="12" y2="20" />
    <polyline points="6,14 12,20 18,14" />
  </svg>
);

export const ArrowUp = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <line x1="12" y1="20" x2="12" y2="4" />
    <polyline points="18,10 12,4 6,10" />
  </svg>
);

export const ArrowUpRight = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <line x1="7" y1="17" x2="17" y2="7" />
    <polyline points="11,7 17,7 17,13" />
  </svg>
);

export const BadgeCheck = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9,12 11,14 15,10" />
    <circle cx="12" cy="12" r="2" fill={GOLD} stroke="none" />
  </svg>
);

export const Ban = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <circle cx="12" cy="12" r="10" />
    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    <circle cx="12" cy="12" r="3" fill={GOLD} stroke="none" />
  </svg>
);

export const BarChart3 = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <line x1="3" y1="21" x2="21" y2="21" />
    <line x1="6" y1="18" x2="6" y2="10" />
    <line x1="12" y1="18" x2="12" y2="6" />
    <line x1="18" y1="18" x2="18" y2="14" />
    <rect x="8" y="8" width="4" height="6" fill={GOLD} stroke="none" rx="0.5" />
  </svg>
);

export const BookUser = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <circle cx="11" cy="9" r="3" />
    <path d="M6 17v-1a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v1" />
    <circle cx="11" cy="9" r="1.5" fill={GOLD} stroke="none" />
  </svg>
);

export const Calendar = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <rect x="10" y="13" width="4" height="3" fill={GOLD} stroke="none" rx="0.5" />
  </svg>
);

export const CheckCircle2 = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="9,12 11,14 15,10" />
    <circle cx="12" cy="12" r="2" fill={GOLD} stroke="none" />
  </svg>
);

export const ChevronDown = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <polyline points="6,9 12,15 18,9" />
  </svg>
);

export const ChevronUp = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <polyline points="18,15 12,9 6,15" />
  </svg>
);

export const ClipboardList = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="8" y1="9" x2="16" y2="9" />
    <line x1="8" y1="13" x2="14" y2="13" />
    <line x1="8" y1="17" x2="12" y2="17" />
    <rect x="10" y="9" width="4" height="2" fill={GOLD} stroke="none" rx="0.3" />
  </svg>
);

export const CreditCard = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <rect x="1" y="4" width="22" height="16" rx="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
    <rect x="3" y="12" width="6" height="4" rx="0.5" fill={GOLD} stroke="none" />
  </svg>
);

export const Filter = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <polygon points="22,3 2,3 10,13 10,21 14,18 14,13 22,3" />
    <rect x="8" y="7" width="8" height="2" fill={GOLD} stroke="none" rx="0.5" />
  </svg>
);

export const GlobeOff = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <circle cx="12" cy="12" r="10" />
    <ellipse cx="12" cy="12" rx="4" ry="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="3" y1="3" x2="21" y2="21" />
  </svg>
);

export const Hash = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <line x1="4" y1="9" x2="20" y2="9" />
    <line x1="4" y1="15" x2="20" y2="15" />
    <line x1="9" y1="4" x2="9" y2="20" />
    <line x1="15" y1="4" x2="15" y2="20" />
    <rect x="7" y="10" width="10" height="4" fill={GOLD} stroke="none" rx="0.5" />
  </svg>
);

export const Minus = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const Pencil = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="M15 5l4 4" />
    <rect x="14" y="14" width="2" height="2" fill={GOLD} stroke="none" rx="0.3" />
  </svg>
);

export const Receipt = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z" />
    <line x1="8" y1="9" x2="16" y2="9" />
    <line x1="8" y1="13" x2="14" y2="13" />
    <rect x="9" y="11" width="6" height="2" fill={GOLD} stroke="none" rx="0.3" />
  </svg>
);

export const RefreshCcw = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <polyline points="1,4 1,10 7,10" />
    <path d="M23 20a9 9 0 0 1-15.24 5.24A9 9 0 0 1 3.07 11" />
    <polyline points="23,20 23,14 17,14" />
    <path d="M1 4a9 9 0 0 1 15.24-5.24A9 9 0 0 1 20.93 13" />
    <circle cx="12" cy="12" r="2" fill={GOLD} stroke="none" />
  </svg>
);

export const RefreshCw = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <polyline points="23,4 23,10 17,10" />
    <path d="M1 20a9 9 0 0 0 15.24 5.24A9 9 0 0 0 20.93 13" />
    <polyline points="1,20 1,14 7,14" />
    <path d="M23 4a9 9 0 0 0-15.24-5.24A9 9 0 0 0 3.07 11" />
    <circle cx="12" cy="12" r="2" fill={GOLD} stroke="none" />
  </svg>
);

export const ScrollText = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="8" y1="11" x2="14" y2="11" />
    <line x1="8" y1="15" x2="12" y2="15" />
    <rect x="9" y="12" width="4" height="2" fill={GOLD} stroke="none" rx="0.3" />
  </svg>
);

export const ShieldCheck = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9,12 11,14 15,10" />
    <circle cx="12" cy="12" r="2" fill={GOLD} stroke="none" />
  </svg>
);

export const ShieldOff = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="3" y1="3" x2="21" y2="21" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

export const TrendingDown = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <polyline points="23,18 17,12 13,16 7,10 1,16" />
    <polyline points="17,18 23,18 23,12" />
    <rect x="13" y="14" width="4" height="2" fill={GOLD} stroke="none" rx="0.3" />
  </svg>
);

export const TrendingUp = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <polyline points="23,6 17,12 13,8 7,14 1,8" />
    <polyline points="17,6 23,6 23,12" />
    <rect x="13" y="7" width="4" height="2" fill={GOLD} stroke="none" rx="0.3" />
  </svg>
);

export const UserPlus = ({ className, size = 24 }: IconProps) => (
  <svg {...s(size)} className={className}>
    <circle cx="10" cy="8" r="5" />
    <path d="M2 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    <line x1="19" y1="5" x2="19" y2="11" />
    <line x1="16" y1="8" x2="22" y2="8" />
    <circle cx="10" cy="8" r="2" fill={GOLD} stroke="none" />
  </svg>
);
