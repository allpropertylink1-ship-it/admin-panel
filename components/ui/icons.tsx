import React from "react";
import {
  IconActivity,
  IconAddressBook,
  IconAdjustmentsHorizontal,
  IconAlertCircle,
  IconArchive,
  IconArrowDown,
  IconArrowLeft,
  IconArrowRight,
  IconArrowUp,
  IconArrowUpRight,
  IconArrowsMaximize,
  IconBan,
  IconBath,
  IconBed,
  IconBell,
  IconBriefcase,
  IconBuilding,
  IconBuildings,
  IconCalendar,
  IconCamera,
  IconCashBanknote,
  IconChartBar,
  IconCheck,
  IconChecks,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronUp,
  IconCircleCheck,
  IconCircleCheckFilled,
  IconCircleX,
  IconClipboardList,
  IconClipboardText,
  IconClock,
  IconCopy,
  IconCreditCard,
  IconCurrencyDollar,
  IconDeviceFloppy,
  IconDownload,
  IconExternalLink,
  IconEye,
  IconEyeOff,
  IconFileText,
  IconFilter,
  IconFlag,
  IconGlobe,
  IconHash,
  IconHeartHandshake,
  IconHome,
  IconKey,
  IconLayoutDashboard,
  IconLink,
  IconLoader2,
  IconLock,
  IconLogout,
  IconMail,
  IconMapPin,
  IconMaximize,
  IconMenu2,
  IconMessageCircle,
  IconMinus,
  IconPencil,
  IconPhone,
  IconPhoto,
  IconPlus,
  IconReceipt,
  IconRefresh,
  IconRosetteDiscountCheck,
  IconRotate2,
  IconRotateClockwise,
  IconSearch,
  IconSettings,
  IconShield,
  IconShieldCheck,
  IconShieldExclamation,
  IconShieldOff,
  IconShieldX,
  IconSparkles,
  IconStar,
  IconTent,
  IconTool,
  IconTrash,
  IconTree,
  IconTrendingDown,
  IconTrendingUp,
  IconUpload,
  IconUser,
  IconUserCheck,
  IconUserPlus,
  IconUsers,
  IconWallet,
  IconWorldOff,
  IconX,
  IconZoomIn,
  IconZoomOut,
} from "@tabler/icons-react";
import type { Icon as TablerIcon } from "@tabler/icons-react";

type IconProps = { className?: string; size?: number; "aria-hidden"?: boolean | "true" | "false" };

const base = (TablerIcon: TablerIcon, name: string) => {
  const Wrapped = ({ className, size = 24, "aria-hidden": ariaHidden = true }: IconProps) => (
    <TablerIcon size={size} stroke={1.5} className={className} aria-hidden={ariaHidden} />
  );
  Wrapped.displayName = `Tabler${name}`;
  return Wrapped;
};

export const AlertCircle = base(IconAlertCircle, "AlertCircle");
export const Archive = base(IconArchive, "Archive");
export const ArrowLeft = base(IconArrowLeft, "ArrowLeft");
export const ArrowRight = base(IconArrowRight, "ArrowRight");
export const Banknote = base(IconCashBanknote, "Banknote");
export const Bath = base(IconBath, "Bath");
export const Bed = base(IconBed, "Bed");
export const Bell = base(IconBell, "Bell");
export const Briefcase = base(IconBriefcase, "Briefcase");
export const Building2 = base(IconBuilding, "Building2");
export const CitiesCovered = base(IconBuildings, "CitiesCovered");
export const Camera = base(IconCamera, "Camera");
export const Check = base(IconCheck, "Check");
export const CheckCheck = base(IconChecks, "CheckCheck");
export const CheckCircle = base(IconCircleCheck, "CheckCircle");
export const ChevronLeft = base(IconChevronLeft, "ChevronLeft");
export const ChevronRight = base(IconChevronRight, "ChevronRight");
export const Clock = base(IconClock, "Clock");
export const Copy = base(IconCopy, "Copy");
export const DollarSign = base(IconCurrencyDollar, "DollarSign");
export const Download = base(IconDownload, "Download");
export const Expand = base(IconArrowsMaximize, "Expand");
export const ExternalLink = base(IconExternalLink, "ExternalLink");
export const Eye = base(IconEye, "Eye");
export const EyeOff = base(IconEyeOff, "EyeOff");
export const FileText = base(IconFileText, "FileText");
export const Flag = base(IconFlag, "Flag");
export const Globe = base(IconGlobe, "Globe");
export const Handshake = base(IconHeartHandshake, "Handshake");
export const Home = base(IconHome, "Home");
export const ImageIcon = base(IconPhoto, "ImageIcon");
export const Key = base(IconKey, "Key");
export const LayoutDashboard = base(IconLayoutDashboard, "LayoutDashboard");
export const Link = base(IconLink, "Link");
export const Loader2 = ({ className, size = 24 }: IconProps) => (
  <IconLoader2
    size={size}
    stroke={1.5}
    className={className ? `${className} animate-spin` : "animate-spin"}
    aria-hidden="true"
  />
);

export const Lock = base(IconLock, "Lock");
export const LogOut = base(IconLogout, "LogOut");
export const Mail = base(IconMail, "Mail");
export const MapPin = base(IconMapPin, "MapPin");
export const Maximize2 = base(IconMaximize, "Maximize2");
export const MessageCircle = base(IconMessageCircle, "MessageCircle");
export const Phone = base(IconPhone, "Phone");
export const Plus = base(IconPlus, "Plus");
export const RotateCw = base(IconRotateClockwise, "RotateCw");
export const Save = base(IconDeviceFloppy, "Save");
export const Search = base(IconSearch, "Search");
export const Shield = base(IconShield, "Shield");
export const ShieldAlert = base(IconShieldExclamation, "ShieldAlert");
export const ShieldX = base(IconShieldX, "ShieldX");
export const SlidersHorizontal = base(IconAdjustmentsHorizontal, "SlidersHorizontal");
export const Sparkles = base(IconSparkles, "Sparkles");
export const Star = base(IconStar, "Star");
export const Tent = base(IconTent, "Tent");
export const TreePine = base(IconTree, "TreePine");
export const Trash2 = base(IconTrash, "Trash2");
export const Upload = base(IconUpload, "Upload");
export const User = base(IconUser, "User");
export const Users = base(IconUsers, "Users");
export const Wallet = base(IconWallet, "Wallet");
export const Wrench = base(IconTool, "Wrench");
export const X = base(IconX, "X");
export const XCircle = base(IconCircleX, "XCircle");
export const ZoomIn = base(IconZoomIn, "ZoomIn");
export const ZoomOut = base(IconZoomOut, "ZoomOut");
export const Menu = base(IconMenu2, "Menu");
export const Settings = base(IconSettings, "Settings");
export const UserCheck = base(IconUserCheck, "UserCheck");
export const Activity = base(IconActivity, "Activity");
export const ArrowDown = base(IconArrowDown, "ArrowDown");
export const ArrowUp = base(IconArrowUp, "ArrowUp");
export const ArrowUpRight = base(IconArrowUpRight, "ArrowUpRight");
export const BadgeCheck = base(IconRosetteDiscountCheck, "BadgeCheck");
export const Ban = base(IconBan, "Ban");
export const BarChart3 = base(IconChartBar, "BarChart3");
export const BookUser = base(IconAddressBook, "BookUser");
export const Calendar = base(IconCalendar, "Calendar");
export const CheckCircle2 = base(IconCircleCheckFilled, "CheckCircle2");
export const ChevronDown = base(IconChevronDown, "ChevronDown");
export const ChevronUp = base(IconChevronUp, "ChevronUp");
export const ClipboardList = base(IconClipboardList, "ClipboardList");
export const CreditCard = base(IconCreditCard, "CreditCard");
export const Filter = base(IconFilter, "Filter");
export const GlobeOff = base(IconWorldOff, "GlobeOff");
export const Hash = base(IconHash, "Hash");
export const Minus = base(IconMinus, "Minus");
export const Pencil = base(IconPencil, "Pencil");
export const Receipt = base(IconReceipt, "Receipt");
export const RefreshCcw = base(IconRotate2, "RefreshCcw");
export const RefreshCw = base(IconRefresh, "RefreshCw");
export const ScrollText = base(IconClipboardText, "ScrollText");
export const ShieldCheck = base(IconShieldCheck, "ShieldCheck");
export const ShieldOff = base(IconShieldOff, "ShieldOff");
export const TrendingDown = base(IconTrendingDown, "TrendingDown");
export const TrendingUp = base(IconTrendingUp, "TrendingUp");
export const UserPlus = base(IconUserPlus, "UserPlus");
