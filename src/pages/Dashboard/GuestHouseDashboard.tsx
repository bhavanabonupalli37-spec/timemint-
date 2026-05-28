import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { GlassCard } from '../../components/ui/GlassCard';
import { 
  Building2, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XSquare, 
  Search, 
  Key, 
  LogIn, 
  LogOut, 
  Check, 
  Activity, 
  FileText, 
  ChevronRight, 
  UserCheck, 
  RefreshCw, 
  HelpCircle, 
  Users, 
  AlertCircle,
  TrendingUp,
  MapPin,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { sendNotification } from '../../lib/notifications';

// --- TYPES ---
interface GuestBooking {
  id: string;
  guestName: string;
  affiliation: string;
  department: string;
  purpose: string;
  roomType: 'Standard' | 'VIP Suite' | 'Executive';
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Checked In' | 'Checked Out';
  submittedBy: string;
  assignedRoom?: string;
  tempPassNo?: string;
  checkedInTime?: string;
  checkedOutTime?: string;
}

interface RoomState {
  number: string;
  type: 'Standard' | 'VIP Suite' | 'Executive';
  status: 'Vacant' | 'Occupied' | 'Cleaning Required';
  currentGuest?: string;
}

interface KeyState {
  roomNumber: string;
  status: 'In Ledger' | 'Issued';
  issuedTo?: string;
}

interface SecurityLedgerEntry {
  id: string;
  name: string;
  passNo: string;
  vehicleNo: string;
  purpose: string;
  timestamp: string;
  action: 'Entry' | 'Exit';
}

// --- INITIAL SEED DATA FOR PREVIEW / DEMO FLUIDITY ---
const INITIAL_BOOKINGS: GuestBooking[] = [
  {
    id: "GH-8032",
    guestName: "Prof. Raghavendra Sharma",
    affiliation: "IIT Kharagpur",
    department: "Physics",
    purpose: "External Ph.D. Thesis Examiner",
    roomType: "VIP Suite",
    startDate: "2026-05-26",
    endDate: "2026-05-28",
    status: "Pending",
    submittedBy: "Head of physics"
  },
  {
    id: "GH-8033",
    guestName: "Dr. Sandeep Banerjee",
    affiliation: "CSIR-NCL Pune",
    department: "Chemistry",
    purpose: "Invited Lecture & Viva-voce",
    roomType: "Executive",
    startDate: "2026-05-25",
    endDate: "2026-05-27",
    status: "Approved",
    submittedBy: "HOD Chemistry"
  },
  {
    id: "GH-8034",
    guestName: "Prof. Sarah Jenkins",
    affiliation: "Oxford University, UK",
    department: "Biology",
    purpose: "International Collaborative Research",
    roomType: "VIP Suite",
    startDate: "2026-05-24",
    endDate: "2026-05-30",
    status: "Checked In",
    submittedBy: "Dr. A. Verma",
    assignedRoom: "201",
    checkedInTime: "2026-05-24 14:15"
  },
  {
    id: "GH-8035",
    guestName: "Dr. Priya Deshmukh",
    affiliation: "IISER Kolkata",
    department: "Mathematics",
    purpose: "Colloquium Speaker",
    roomType: "Standard",
    startDate: "2026-05-25",
    endDate: "2026-05-26",
    status: "Approved",
    submittedBy: "Dr. K. Iyer"
  },
  {
    id: "GH-8036",
    guestName: "Prof. Thomas Alva",
    affiliation: "IISER Thiruvananthapuram",
    department: "Interdisciplinary Sciences",
    purpose: "Institute Senate Meeting",
    roomType: "Executive",
    startDate: "2026-05-22",
    endDate: "2026-05-25",
    status: "Checked Out",
    submittedBy: "Registrar IISER",
    assignedRoom: "103",
    checkedInTime: "2026-05-22 11:00",
    checkedOutTime: "2026-05-25 09:15"
  }
];

const INITIAL_ROOMS: RoomState[] = [
  { number: "101", type: "Standard", status: "Vacant" },
  { number: "102", type: "Standard", status: "Vacant" },
  { number: "103", type: "Standard", status: "Cleaning Required" },
  { number: "104", type: "Standard", status: "Vacant" },
  { number: "105", type: "Standard", status: "Vacant" },
  { number: "201", type: "VIP Suite", status: "Occupied", currentGuest: "Prof. Sarah Jenkins" },
  { number: "202", type: "VIP Suite", status: "Vacant" },
  { number: "203", type: "VIP Suite", status: "Vacant" },
  { number: "301", type: "Executive", status: "Vacant" },
  { number: "302", type: "Executive", status: "Vacant" }
];

const INITIAL_KEYS: KeyState[] = [
  { roomNumber: "101", status: "In Ledger" },
  { roomNumber: "102", status: "In Ledger" },
  { roomNumber: "103", status: "In Ledger" },
  { roomNumber: "104", status: "In Ledger" },
  { roomNumber: "105", status: "In Ledger" },
  { roomNumber: "201", status: "Issued", issuedTo: "Prof. Sarah Jenkins" },
  { roomNumber: "202", status: "In Ledger" },
  { roomNumber: "203", status: "In Ledger" },
  { roomNumber: "301", status: "In Ledger" },
  { roomNumber: "302", status: "In Ledger" }
];

const INITIAL_SECURITY_LEDGER: SecurityLedgerEntry[] = [
  { id: "S-1", name: "Prof. Sarah Jenkins", passNo: "IISER-PASS-801", vehicleNo: "MH-12-PQ-9081", purpose: "Collaborator check-in", timestamp: "2026-05-24 14:15", action: "Entry" },
  { id: "S-2", name: "Prof. Thomas Alva", passNo: "IISER-PASS-795", vehicleNo: "DL-3C-AS-5561", purpose: "Senate checkout departure", timestamp: "2026-05-25 09:15", action: "Exit" }
];

export default function GuestHouseDashboard() {
  const { user, userData, refreshUserData } = useAuth();
  const [activeRole, setActiveRole] = useState<'Admin' | 'HOD' | 'Employee' | 'Security'>('Admin');
  
  // State management seeded from local storage or initial values
  const [bookings, setBookings] = useState<GuestBooking[]>(() => {
    const saved = localStorage.getItem('gh_bookings');
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });

  const [rooms, setRooms] = useState<RoomState[]>(() => {
    const saved = localStorage.getItem('gh_rooms');
    return saved ? JSON.parse(saved) : INITIAL_ROOMS;
  });

  const [keys, setKeys] = useState<KeyState[]>(() => {
    const saved = localStorage.getItem('gh_keys');
    return saved ? JSON.parse(saved) : INITIAL_KEYS;
  });

  const [securityLedger, setSecurityLedger] = useState<SecurityLedgerEntry[]>(() => {
    const saved = localStorage.getItem('gh_sec_ledger');
    return saved ? JSON.parse(saved) : INITIAL_SECURITY_LEDGER;
  });

  // HOD & Employee submission states
  const [newGuestName, setNewGuestName] = useState('');
  const [newAffiliation, setNewAffiliation] = useState('');
  const [newPurpose, setNewPurpose] = useState('');
  const [newRoomType, setNewRoomType] = useState<'Standard' | 'VIP Suite' | 'Executive'>('Standard');
  const [newStartDate, setNewStartDate] = useState('2026-05-26');
  const [newEndDate, setNewEndDate] = useState('2026-05-28');

  // Security check-in search & quick entry
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBookingForCheckIn, setSelectedBookingForCheckIn] = useState<string | null>(null);
  const [assignedRoomForCheckIn, setAssignedRoomForCheckIn] = useState('101');
  const [tempPassNoInput, setTempPassNoInput] = useState('');
  const [vehicleNoInput, setVehicleNoInput] = useState('');

  // Security gate registration form
  const [gateName, setGateName] = useState('');
  const [gatePurpose, setGatePurpose] = useState('');
  const [gatePassNo, setGatePassNo] = useState('');
  const [gateVehicleNo, setGateVehicleNo] = useState('');

  // System statistics/KPIs
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Auto-align default role when user/userData is fetched
  useEffect(() => {
    if (userData?.role) {
      const r = userData.role as any;
      if (['Admin', 'HOD', 'Employee', 'Security'].includes(r)) {
        setActiveRole(r);
      }
    }
  }, [userData]);

  // Sync state to local storage on modification
  useEffect(() => {
    localStorage.setItem('gh_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('gh_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('gh_keys', JSON.stringify(keys));
  }, [keys]);

  useEffect(() => {
    localStorage.setItem('gh_sec_ledger', JSON.stringify(securityLedger));
  }, [securityLedger]);

  // Utility to show beautiful transient toast feedbacks
  const showFeedback = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4500);
  };

  // --- HANDLERS ---

  // Admin approval
  const handleApproveBooking = (id: string) => {
    const updated = bookings.map(b => {
      if (b.id === id) {
        showFeedback(`Requisition ${id} successfully Approved.`, 'success');
        sendNotification("Booking Approved", { body: `Booking for ${b.guestName} authorized.` });
        return { ...b, status: 'Approved' as const };
      }
      return b;
    });
    setBookings(updated);
  };

  // Admin rejection
  const handleRejectBooking = (id: string) => {
    const updated = bookings.map(b => {
      if (b.id === id) {
        showFeedback(`Requisition ${id} has been Rejected.`, 'info');
        return { ...b, status: 'Rejected' as const };
      }
      return b;
    });
    setBookings(updated);
  };

  // Room status quick toggler (Admin/Maintenance status changes)
  const handleToggleRoomStatus = (roomNum: string) => {
    const updated = rooms.map(r => {
      if (r.number === roomNum) {
        let nextStatus: 'Vacant' | 'Occupied' | 'Cleaning Required' = 'Vacant';
        if (r.status === 'Vacant') nextStatus = 'Occupied';
        else if (r.status === 'Occupied') nextStatus = 'Cleaning Required';
        else nextStatus = 'Vacant';

        showFeedback(`Room ${roomNum} status changed to ${nextStatus}`, 'info');
        return { ...r, status: nextStatus, currentGuest: nextStatus === 'Vacant' ? undefined : r.currentGuest };
      }
      return r;
    });
    setRooms(updated);
  };

  // HOD/Employee submit new requisition
  const handleNewRequisitionSubmit = (e: React.FormEvent, isOfficialHOD: boolean) => {
    e.preventDefault();
    if (!newGuestName || !newAffiliation || !newPurpose) {
      showFeedback("Please fill out all required fields", "error");
      return;
    }

    const newBooking: GuestBooking = {
      id: `GH-${Math.floor(1000 + Math.random() * 9000)}`,
      guestName: newGuestName,
      affiliation: newAffiliation,
      department: isOfficialHOD ? "Official" : (userData?.role || "Employee Request"),
      purpose: newPurpose,
      roomType: newRoomType,
      startDate: newStartDate,
      endDate: newEndDate,
      status: isOfficialHOD ? 'Pending' : 'Pending', // All need admin authorization
      submittedBy: userData?.name || 'Authorized Member'
    };

    setBookings([newBooking, ...bookings]);
    showFeedback(`Requisition requested successfully under booking ID: ${newBooking.id}`, 'success');

    // Reset Form Fields
    setNewGuestName('');
    setNewAffiliation('');
    setNewPurpose('');
  };

  // Canceling a booking (Available for HOD and Employee)
  const handleCancelBooking = (id: string) => {
    const updated = bookings.filter(b => b.id !== id);
    setBookings(updated);
    showFeedback(`Requisition ${id} removed successfully.`, 'info');
  };

  // Key cabinet hook toggling (Security check tracker)
  const handleToggleKey = (roomNum: string) => {
    const updated = keys.map(k => {
      if (k.roomNumber === roomNum) {
        const nextStatus = k.status === 'In Ledger' ? 'Issued' : 'In Ledger';
        showFeedback(`Key ${roomNum} marked as ${nextStatus}`, 'success');
        return { 
          ...k, 
          status: nextStatus as any,
          issuedTo: nextStatus === 'In Ledger' ? undefined : k.issuedTo || 'Checked-in Guest'
        };
      }
      return k;
    });
    setKeys(updated);
  };

  // Security Checkout process
  const handleCheckOut = (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    // 1. Set booking status to Checked Out
    const updatedBookings = bookings.map(b => {
      if (b.id === bookingId) {
        return { 
          ...b, 
          status: 'Checked Out' as const,
          checkedOutTime: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
      }
      return b;
    });
    setBookings(updatedBookings);

    // 2. Free assigned room & mark as Cleaning Required
    if (booking.assignedRoom) {
      setRooms(rooms.map(r => {
        if (r.number === booking.assignedRoom) {
          return { ...r, status: 'Cleaning Required', currentGuest: undefined };
        }
        return r;
      }));

      // 3. Mark key as back in Ledger
      setKeys(keys.map(k => {
        if (k.roomNumber === booking.assignedRoom) {
          return { ...k, status: 'In Ledger', issuedTo: undefined };
        }
        return k;
      }));
    }

    // 4. Register egress in gate ledger
    const nextSecId = `S-${securityLedger.length + 1}`;
    const entry: SecurityLedgerEntry = {
      id: nextSecId,
      name: booking.guestName,
      passNo: booking.tempPassNo || 'N/A',
      vehicleNo: 'Noted',
      purpose: `Checkout complete (${booking.id})`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      action: 'Exit'
    };
    setSecurityLedger([entry, ...securityLedger]);

    showFeedback(`Guest ${booking.guestName} has checked out. Key returned, room marked for cleaning.`, 'success');
  };

  // Security Check-In completion
  const handleCompleteCheckInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForCheckIn) {
      showFeedback("Please select a guest booking code.", "error");
      return;
    }

    const booking = bookings.find(b => b.id === selectedBookingForCheckIn);
    if (!booking) return;

    // 1. Update Booking Status -> 'Checked In'
    const updatedBookings = bookings.map(b => {
      if (b.id === selectedBookingForCheckIn) {
        return {
          ...b,
          status: 'Checked In' as const,
          assignedRoom: assignedRoomForCheckIn,
          tempPassNo: tempPassNoInput || `IISER-PASS-${Math.floor(100 + Math.random() * 900)}`,
          checkedInTime: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };
      }
      return b;
    });
    setBookings(updatedBookings);

    // 2. Update Room Status -> 'Occupied'
    const updatedRooms = rooms.map(r => {
      if (r.number === assignedRoomForCheckIn) {
        return { ...r, status: 'Occupied' as const, currentGuest: booking.guestName };
      }
      return r;
    });
    setRooms(updatedRooms);

    // 3. Update Key Cabinet -> Issued to the guest
    const updatedKeys = keys.map(k => {
      if (k.roomNumber === assignedRoomForCheckIn) {
        return { ...k, status: 'Issued' as const, issuedTo: booking.guestName };
      }
      return k;
    });
    setKeys(updatedKeys);

    // 4. Log entrance event in security gate ledger
    const nextSecId = `S-${securityLedger.length + 1}`;
    const entry: SecurityLedgerEntry = {
      id: nextSecId,
      name: booking.guestName,
      passNo: tempPassNoInput || `PASS-${Math.floor(200 + Math.random() * 600)}`,
      vehicleNo: vehicleNoInput || 'N/A',
      purpose: `IISER Check-in to Room ${assignedRoomForCheckIn}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      action: 'Entry'
    };
    setSecurityLedger([entry, ...securityLedger]);

    showFeedback(`Check-In Completed! Room ${assignedRoomForCheckIn} allocated to ${booking.guestName}.`, 'success');

    // Reset controls
    setSelectedBookingForCheckIn(null);
    setTempPassNoInput('');
    setVehicleNoInput('');
  };

  // Add guest manually to security ledger
  const handleAddGateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gateName || !gatePurpose) {
      showFeedback("Please supply visitor name and purpose.", "error");
      return;
    }

    const nextId = `S-${securityLedger.length + 1}`;
    const newEntry: SecurityLedgerEntry = {
      id: nextId,
      name: gateName,
      passNo: gatePassNo || 'VISITOR-PASS',
      vehicleNo: gateVehicleNo || 'N/A',
      purpose: gatePurpose,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      action: 'Entry'
    };

    setSecurityLedger([newEntry, ...securityLedger]);
    showFeedback(`Security gate entry recorded for ${gateName}`, 'success');

    // Reset
    setGateName('');
    setGatePurpose('');
    setGatePassNo('');
    setGateVehicleNo('');
  };


  // --- ROLE VALUE OVERRIDES (DEVELOPER TESTING MODE) ---
  const handleDeveloperRoleOverride = (role: 'Admin' | 'HOD' | 'Employee' | 'Security') => {
    setActiveRole(role);
    showFeedback(`Overridden interface view to: ${role} Dashboard`, 'success');
  };

  // Render Stats & KPIs based on whichever role is actively being previewed
  const renderStatsRow = () => {
    const pendingCount = bookings.filter(b => b.status === 'Pending').length;
    const occupiedCount = rooms.filter(r => r.status === 'Occupied').length;
    const cleaningCount = rooms.filter(r => r.status === 'Cleaning Required').length;
    const totalRooms = rooms.length;

    if (activeRole === 'Admin') {
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="p-5 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Occupancy Rate</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{Math.round((occupiedCount / totalRooms) * 100)}%</span>
              <span className="text-xs text-slate-500">({occupiedCount}/{totalRooms} Rooms)</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-primary-400" style={{ width: `${(occupiedCount / totalRooms) * 100}%` }} />
            </div>
          </div>
          <div className="p-5 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Pending Approvals</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-amber-400">{pendingCount}</span>
              <span className="text-xs text-slate-500">Requisitions review</span>
            </div>
          </div>
          <div className="p-5 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Maintenance Queue</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-rose-400">{cleaningCount}</span>
              <span className="text-xs text-slate-500">Required sanitation</span>
            </div>
          </div>
          <div className="p-5 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Active Visitors</p>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-sky-400">{bookings.filter(b => b.status === 'Checked In').length}</span>
              <span className="text-xs text-slate-500">Currently residing</span>
            </div>
          </div>
        </div>
      );
    } else if (activeRole === 'HOD') {
      const dept = "Chemistry"; // Simulating a department
      const deptBookings = bookings.filter(b => b.department.toLowerCase().includes(dept.toLowerCase()) || b.department === 'Official');
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="p-5 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Department Stats</p>
            <span className="text-xl font-bold text-white">Dept: Physics & Chem</span>
            <p className="text-[10px] text-slate-500 mt-1">Institutional Host authority</p>
          </div>
          <div className="p-5 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Active Requisitions</p>
            <span className="text-2xl font-bold text-amber-400">{deptBookings.filter(b => b.status === 'Pending').length}</span>
            <span className="text-xs text-slate-500 block">Under admin check</span>
          </div>
          <div className="p-5 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Approved reservations</p>
            <span className="text-2xl font-bold text-emerald-400">{deptBookings.filter(b => b.status === 'Approved' || b.status === 'Checked In').length}</span>
            <span className="text-xs text-slate-500 block">Allocations ready</span>
          </div>
          <div className="p-5 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Budget Ledger</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-white">₹84,500</span>
              <span className="text-[9px] text-slate-500">Remaining</span>
            </div>
            <p className="text-[9px] text-[rgba(45,212,191,0.6)] mt-1">Authorized Official Subsidized Rates</p>
          </div>
        </div>
      );
    } else if (activeRole === 'Employee') {
      const myBookings = bookings.filter(b => b.submittedBy === (userData?.name || 'Dr. K. Iyer'));
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="p-5 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">My Guest Board</p>
            <span className="text-xl font-bold text-white">{userData?.name || "Faculty Member"}</span>
            <p className="text-[10px] text-slate-400 mt-1">Staff portal requisitions</p>
          </div>
          <div className="p-5 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Sent Requests</p>
            <span className="text-2xl font-bold text-white">{myBookings.length}</span>
            <span className="text-xs text-slate-500 block">Total Guest bookings</span>
          </div>
          <div className="p-5 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Pending Approval</p>
            <span className="text-2xl font-bold text-amber-500">{myBookings.filter(b => b.status === 'Pending').length}</span>
            <span className="text-xs text-slate-500 block">Awaiting admin review</span>
          </div>
          <div className="p-5 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Authorized Stay</p>
            <span className="text-2xl font-bold text-emerald-400">{myBookings.filter(b => b.status === "Approved" || b.status === "Checked In").length}</span>
            <span className="text-xs text-slate-500 block">Confirmed guest house slots</span>
          </div>
        </div>
      );
    } else {
      // Security role statistics
      const shiftsIn = securityLedger.filter(s => s.action === 'Entry').length;
      return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="p-5 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Checkpoint</p>
            <span className="text-xl font-bold text-white">Main Entrance Gate</span>
            <p className="text-[10px] text-rose-400 mt-1">Logged Security shifts</p>
          </div>
          <div className="p-5 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Gate Arrivals Today</p>
            <span className="text-2xl font-bold text-white">{shiftsIn} Entries</span>
            <span className="text-xs text-slate-500 block">Manually verified logs</span>
          </div>
          <div className="p-5 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Keys Cabinets Released</p>
            <span className="text-2xl font-bold text-amber-400">{keys.filter(k => k.status === 'Issued').length} Keys</span>
            <span className="text-xs text-slate-500 block">Currently with visiting guests</span>
          </div>
          <div className="p-5 bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 rounded-2xl">
            <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Pending Checkouts</p>
            <span className="text-2xl font-bold text-sky-400">
              {bookings.filter(b => b.status === 'Checked In').length}
            </span>
            <span className="text-xs text-slate-500 block">Awaiting physical dispatch</span>
          </div>
        </div>
      );
    }
  };


  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 pb-20">
      
      {/* Toast Feedback notifications banner */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={cn(
              "fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md",
              feedbackMsg.type === 'success' ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300" :
              feedbackMsg.type === 'error' ? "bg-rose-500/20 border-rose-500/30 text-rose-300" :
              "bg-blue-500/20 border-blue-500/30 text-blue-300"
            )}
          >
            {feedbackMsg.type === 'success' && <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />}
            {feedbackMsg.type === 'error' && <AlertCircle size={18} className="text-rose-400 shrink-0" />}
            {feedbackMsg.type === 'info' && <Activity size={18} className="text-blue-400 shrink-0" />}
            <span className="text-sm font-semibold">{feedbackMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- FLOATING SANDBOX ROLE TUNER FOR INTERFACE EVALUATORS --- */}
      <div className="bg-primary-950/20 border border-primary-500/20 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div>
            <span className="text-xs font-bold text-primary-400 uppercase tracking-widest block">Institutional Sandbox Controller</span>
            <p className="text-xs text-slate-400 leading-tight">Switch views to inspect each of the requested IISER dashboards live:</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {['Admin', 'HOD', 'Employee', 'Security'].map((role) => (
            <button
              key={role}
              onClick={() => handleDeveloperRoleOverride(role as any)}
              className={cn(
                "px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer",
                activeRole === role 
                  ? "bg-primary-400 text-black shadow-lg shadow-primary-400/20" 
                  : "bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10"
              )}
            >
              {role} Dashboard
            </button>
          ))}
        </div>
      </div>

      {/* --- DASHBOARD HEADER --- */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2">
        <div>
          <span className="text-xs font-black tracking-widest text-primary-400 uppercase">IISER GUEST HOUSE PORTAL</span>
          <h1 className="text-4xl font-display font-medium text-white tracking-tight mt-1">
            Welcome, {user?.displayName ? user.displayName.split(' ')[0] : 'IISER Member'} 
            <span className="text-primary-400 font-bold ml-2">({activeRole})</span>
          </h1>
          <p className="text-slate-400 mt-2 text-sm leading-relaxed max-w-2xl">
            {activeRole === 'Admin' && "Administrative control center for Guest House approvals, room allocation, and occupancy logistics."}
            {activeRole === 'HOD' && "Official departmental guest requisition management and budgetary submittals."}
            {activeRole === 'Employee' && "Submit visiting guest applications, track authorization pipelines, and manage bookings."}
            {activeRole === 'Security' && "Manage front gate check-ins, record physical entry rosters, and monitor key card lockers."}
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white/5 border border-white/5 p-4 rounded-2xl text-right">
          <Clock size={20} className="text-primary-400" />
          <div>
            <p className="text-lg font-mono text-white">09:12 UTC</p>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Mon, May 25, 2026</p>
          </div>
        </div>
      </header>

      {/* Stats indicators */}
      {renderStatsRow()}

      {/* --- MAIN DASHBOARD INTERFACES GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- LEFT HAND PANELS (2-col span) --- */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* =======================================================
              1. ADMIN ROLE DASHBOARD VIEW
              ======================================================= */}
          {activeRole === 'Admin' && (
            <div className="space-y-8">
              {/* Approvals manager */}
              <GlassCard className="p-6 border-white/10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <ClipboardList className="text-primary-400" size={22} />
                    <h3 className="text-lg font-bold text-white font-display">Pending Booking Requisitions</h3>
                  </div>
                  <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg text-[10px] font-bold uppercase">
                    Awaiting authorization
                  </span>
                </div>

                <div className="space-y-4">
                  {bookings.filter(b => b.status === 'Pending').length === 0 ? (
                    <div className="p-12 text-center text-slate-500 italic bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
                      No pending requisitions are currently active. All guest requests are processed!
                    </div>
                  ) : (
                    bookings.filter(b => b.status === 'Pending').map((booking) => (
                      <div 
                        key={booking.id} 
                        className="p-5 bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-2xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-2 max-w-md">
                          <div className="flex items-center gap-3">
                            <h4 className="text-sm font-bold text-white">{booking.guestName}</h4>
                            <span className="px-2 py-0.5 text-[9px] bg-slate-800 border border-slate-700 text-slate-400 rounded font-mono">
                              {booking.id}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-400">
                            <strong>Affiliation:</strong> {booking.affiliation} <span className="text-slate-600">|</span> <strong>Dept:</strong> {booking.department}
                          </p>
                          <p className="text-xs text-slate-400 italic">
                            &quot;{booking.purpose}&quot;
                          </p>
                          
                          <div className="flex items-center gap-4 text-[10px] text-slate-500">
                            <span>📅 {booking.startDate} to {booking.endDate}</span>
                            <span>⭐ Type: {booking.roomType}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleApproveBooking(booking.id)}
                            className="p-2.5 bg-emerald-500 text-black hover:bg-emerald-400 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Check size={14} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectBooking(booking.id)}
                            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>

              {/* Master bookings register log review */}
              <GlassCard className="p-6 border-white/10">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-bold font-display text-lg">System Reservations Registry</h3>
                    <p className="text-xs text-slate-500">Historical logs of approved and checked-out visitors.</p>
                  </div>
                  <span className="text-xs font-bold text-primary-400 font-mono">Total Registry: {bookings.length}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-slate-500">
                        <th className="pb-3 font-semibold">Guest</th>
                        <th className="pb-3 font-semibold">Category</th>
                        <th className="pb-3 font-semibold">Date of Stay</th>
                        <th className="pb-3 font-semibold">Allocated Room</th>
                        <th className="pb-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {bookings.map((b) => (
                        <tr key={b.id} className="hover:bg-white/[0.01] transition-all">
                          <td className="py-4">
                            <p className="font-bold text-white">{b.guestName}</p>
                            <p className="text-[10px] text-slate-500">{b.affiliation}</p>
                          </td>
                          <td className="py-4 font-medium text-slate-400">{b.roomType}</td>
                          <td className="py-4 font-mono text-slate-500">{b.startDate} to {b.endDate}</td>
                          <td className="py-4">
                            {b.assignedRoom ? (
                              <span className="px-2 py-1 bg-primary-400/10 text-primary-400 rounded-lg font-bold font-mono">
                                Room {b.assignedRoom}
                              </span>
                            ) : (
                              <span className="text-slate-600 italic">None</span>
                            )}
                          </td>
                          <td className="py-4">
                            <span className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                              b.status === 'Checked In' ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              b.status === 'Approved' ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                              b.status === 'Checked Out' ? "bg-slate-800 text-slate-400" :
                              b.status === 'Rejected' ? "bg-rose-500/10 text-rose-400" :
                              "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            )}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </GlassCard>
            </div>
          )}


          {/* =======================================================
              2. HOD ROLE DASHBOARD VIEW
              ======================================================= */}
          {activeRole === 'HOD' && (
            <div className="space-y-8">
              {/* official reservation submittal form */}
              <GlassCard className="p-6 border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <Plus className="text-primary-400" size={22} />
                  <div>
                    <h3 className="text-lg font-bold text-white font-display">New Departmental Requisition Submittal</h3>
                    <p className="text-xs text-slate-500">Provide verified administrative host details for guest house reservation.</p>
                  </div>
                </div>

                <form onSubmit={(e) => handleNewRequisitionSubmit(e, true)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-medium">Guest Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={newGuestName}
                        onChange={(e) => setNewGuestName(e.target.value)}
                        placeholder="e.g. Prof. Satish Chandra" 
                        className="w-full p-3 bg-white/5 border border-white/5 focus:border-primary-500 rounded-xl outline-none text-slate-200 text-xs text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-medium">Guest Affiliation (Institution)</label>
                      <input 
                        type="text" 
                        required
                        value={newAffiliation}
                        onChange={(e) => setNewAffiliation(e.target.value)}
                        placeholder="e.g. IISER Bhopal / IUCAA" 
                        className="w-full p-3 bg-white/5 border border-white/5 focus:border-primary-500 rounded-xl outline-none text-slate-200 text-xs text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Purpose of Visit (Detailed)</label>
                    <textarea 
                      required
                      value={newPurpose}
                      onChange={(e) => setNewPurpose(e.target.value)}
                      placeholder="e.g. Visiting Professor for collaborative DST-SERB project discussion to biological labs" 
                      className="w-full p-3 bg-white/5 border border-white/5 focus:border-primary-500 rounded-xl outline-none text-slate-200 text-xs text-sm h-20"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-medium">Room Class Required</label>
                      <select 
                        value={newRoomType}
                        onChange={(e: any) => setNewRoomType(e.target.value)}
                        className="w-full p-3 bg-white/5 border border-white/5 focus:border-primary-500 rounded-xl outline-none text-slate-200 text-xs text-sm font-sans"
                      >
                        <option value="Standard">Standard (Subsidized)</option>
                        <option value="Executive">Executive Suite</option>
                        <option value="VIP Suite">VIP Director Suite</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-medium">Arrival Date</label>
                      <input 
                        type="date" 
                        required
                        value={newStartDate}
                        onChange={(e) => setNewStartDate(e.target.value)}
                        className="w-full p-3 bg-white/5 border border-white/5 focus:border-primary-500 rounded-xl outline-none text-slate-200 text-xs text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-medium">Departure Date</label>
                      <input 
                        type="date" 
                        required
                        value={newEndDate}
                        onChange={(e) => setNewEndDate(e.target.value)}
                        className="w-full p-3 bg-white/5 border border-white/5 focus:border-primary-500 rounded-xl outline-none text-slate-200 text-xs text-sm"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2 mt-2 shadow-lg shadow-primary-600/10"
                  >
                    <Plus size={16} />
                    Issue Requisition
                  </button>
                </form>
              </GlassCard>

              {/* Departmental requests list */}
              <GlassCard className="p-6 border-white/10">
                <h3 className="text-white font-bold font-display text-lg mb-4">Department Pipeline Tracker</h3>
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white text-sm">{booking.guestName}</p>
                          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-mono">{booking.id}</span>
                        </div>
                        <p className="text-xs text-slate-400">{booking.affiliation} &bull; {booking.roomType}</p>
                        <p className="text-[10px] text-slate-500 mt-1">Calendar Window: {booking.startDate} to {booking.endDate}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className={cn(
                          "px-2 py-1 text-[9px] font-black uppercase rounded",
                          booking.status === 'Approved' ? "bg-blue-500/10 text-blue-400" :
                          booking.status === 'Checked In' ? "bg-emerald-500/10 text-emerald-400" :
                          booking.status === 'Checked Out' ? "bg-slate-800 text-slate-400" :
                          booking.status === 'Rejected' ? "bg-rose-500/10 text-rose-400" :
                          "bg-amber-500/10 text-amber-500"
                        )}>
                          {booking.status}
                        </span>

                        {booking.status === 'Pending' && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="p-1.5 text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}


          {/* =======================================================
              3. EMPLOYEE ROLE DASHBOARD VIEW
              ======================================================= */}
          {activeRole === 'Employee' && (
            <div className="space-y-8">
              {/* Employee reservation requisitor */}
              <GlassCard className="p-6 border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <FileText className="text-primary-400" size={22} />
                  <div>
                    <h3 className="text-lg font-bold text-white font-display">New Visitor Stay Request</h3>
                    <p className="text-xs text-slate-500">Request guest house rooms for project collaborators or family visits.</p>
                  </div>
                </div>

                <form onSubmit={(e) => handleNewRequisitionSubmit(e, false)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-medium">Guest Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={newGuestName}
                        onChange={(e) => setNewGuestName(e.target.value)}
                        placeholder="e.g. Dr. Jennifer Doudna" 
                        className="w-full p-3 bg-white/5 border border-white/5 focus:border-primary-500 rounded-xl outline-none text-slate-200 text-xs text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-medium">Affiliation / Organization</label>
                      <input 
                        type="text" 
                        required
                        value={newAffiliation}
                        onChange={(e) => setNewAffiliation(e.target.value)}
                        placeholder="e.g. UC Berkeley, USA" 
                        className="w-full p-3 bg-white/5 border border-white/5 focus:border-primary-500 rounded-xl outline-none text-slate-200 text-xs text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-slate-400 font-medium">Detailed Reason / Stay Purpose</label>
                    <textarea 
                      required
                      value={newPurpose}
                      onChange={(e) => setNewPurpose(e.target.value)}
                      placeholder="Invited guest speaker and student interaction facilitator for Biology department" 
                      className="w-full p-3 bg-white/5 border border-white/5 focus:border-primary-500 rounded-xl outline-none text-slate-200 text-xs text-sm h-20"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-medium font-sans">Room Class Type</label>
                      <select 
                        value={newRoomType}
                        onChange={(e: any) => setNewRoomType(e.target.value)}
                        className="w-full p-3 bg-white/5 border border-white/5 focus:border-primary-500 rounded-xl outline-none text-slate-200 text-xs text-sm font-sans"
                      >
                        <option value="Standard">Standard Single</option>
                        <option value="Executive">Executive Suite</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-medium">Expected Check-in</label>
                      <input 
                        type="date" 
                        required
                        value={newStartDate}
                        onChange={(e) => setNewStartDate(e.target.value)}
                        className="w-full p-3 bg-white/5 border border-white/5 focus:border-primary-500 rounded-xl outline-none text-slate-200 text-xs text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-medium">Expected Check-out</label>
                      <input 
                        type="date" 
                        required
                        value={newEndDate}
                        onChange={(e) => setNewEndDate(e.target.value)}
                        className="w-full p-3 bg-white/5 border border-white/5 focus:border-primary-500 rounded-xl outline-none text-slate-200 text-xs text-sm"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2 shadow-lg shadow-primary-600/10 mt-2"
                  >
                    <Plus size={16} />
                    File Reservation Request
                  </button>
                </form>
              </GlassCard>

              {/* Employee booking applications lists */}
              <GlassCard className="p-6 border-white/10">
                <h3 className="text-white font-bold font-display text-lg mb-4">My Submitted Requisitions</h3>
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-white text-sm">{booking.guestName}</p>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1 py-0.2 rounded font-mono">{booking.id}</span>
                        </div>
                        <p className="text-xs text-slate-400">{booking.affiliation} &bull; Room: {booking.roomType}</p>
                        <p className="text-[10px] text-slate-500 font-mono mt-1">Calendar Period: {booking.startDate} ~ {booking.endDate}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn(
                          "px-2 py-0.5 text-[9px] font-black uppercase rounded",
                          booking.status === 'Approved' ? "bg-blue-500/10 text-blue-400" :
                          booking.status === 'Checked In' ? "bg-emerald-500/10 text-emerald-400" :
                          booking.status === 'Checked Out' ? "bg-slate-800 text-slate-400" :
                          booking.status === 'Rejected' ? "bg-rose-500/10 text-rose-400" :
                          "bg-amber-500/10 text-amber-500"
                        )}>
                          {booking.status}
                        </span>
                        
                        {booking.status === 'Pending' && (
                          <button
                            onClick={() => handleCancelBooking(booking.id)}
                            className="p-1 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          )}


          {/* =======================================================
              4. SECURITY CHECKPOINT ROLE DASHBOARD VIEW
              ======================================================= */}
          {activeRole === 'Security' && (
            <div className="space-y-8">
              
              {/* Quick Guest check-in and checkout dispatcher */}
              <GlassCard className="p-6 border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <Users className="text-primary-400" size={22} />
                  <div>
                    <h3 className="text-lg font-bold text-white font-display">Checkpoint Arrival Check-in Desk</h3>
                    <p className="text-xs text-slate-500">Search and check in authorized guests, allocate physical rooms, and issue ledger passes.</p>
                  </div>
                </div>

                {/* Arrival checkin matching form */}
                <form onSubmit={handleCompleteCheckInSubmit} className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-4">
                  <p className="text-xs font-bold text-white mb-2 uppercase tracking-wide">Authorized Guest Matcher</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs text-slate-400 font-medium">Select Approved Booking Code</label>
                      <select
                        value={selectedBookingForCheckIn || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedBookingForCheckIn(val || null);
                          // Suggest first vacant room based on type
                          const targetType = bookings.find(b => b.id === val)?.roomType;
                          const available = rooms.find(r => r.status === 'Vacant' && (targetType ? r.type === targetType : true));
                          if (available) setAssignedRoomForCheckIn(available.number);
                        }}
                        className="w-full p-3 bg-slate-900 border border-white/5 rounded-xl outline-none text-slate-300 text-xs"
                      >
                        <option value="">-- Choose Approved Guest Booking --</option>
                        {bookings.filter(b => b.status === 'Approved').map(b => (
                          <option key={b.id} value={b.id}>
                            {b.id} - {b.guestName} ({b.roomType})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1 font-mono">
                      <label className="text-xs text-slate-400 font-sans font-medium">Allocate Vacant Room</label>
                      <select 
                        value={assignedRoomForCheckIn}
                        onChange={(e) => setAssignedRoomForCheckIn(e.target.value)}
                        className="w-full p-3 bg-slate-900 border border-white/5 rounded-xl outline-none text-slate-300 text-xs"
                      >
                        {rooms.filter(r => r.status === 'Vacant').map(r => (
                          <option key={r.number} value={r.number}>
                            Room {r.number} ({r.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedBookingForCheckIn && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">Security Pass Serial Number</label>
                        <input 
                          type="text" 
                          value={tempPassNoInput}
                          onChange={(e) => setTempPassNoInput(e.target.value)}
                          placeholder="e.g. IISER-PASS-811" 
                          className="w-full p-2.5 bg-slate-950 border border-white/5 rounded-lg outline-none text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-slate-500">Arrival Vehicle Registration</label>
                        <input 
                          type="text" 
                          value={vehicleNoInput}
                          onChange={(e) => setVehicleNoInput(e.target.value)}
                          placeholder="e.g. DL-3C-AZ-5040" 
                          className="w-full p-2.5 bg-slate-950 border border-white/5 rounded-lg outline-none text-xs"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!selectedBookingForCheckIn}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2 shadow-lg shadow-primary-600/10 cursor-pointer disabled:opacity-40"
                  >
                    <LogIn size={16} />
                    Complete Reception Check-In
                  </button>
                </form>
              </GlassCard>

              {/* Active Guests list for Checkouts */}
              <GlassCard className="p-6 border-white/10">
                <h3 className="text-white font-bold font-display text-lg mb-4">Checked-In Guests (Currently Residing)</h3>
                <div className="space-y-4">
                  {bookings.filter(b => b.status === "Checked In").length === 0 ? (
                    <div className="p-8 text-center text-slate-500 italic">No guests are currently checked in.</div>
                  ) : (
                    bookings.filter(b => b.status === "Checked In").map(b => (
                      <div key={b.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-white text-sm">{b.guestName}</p>
                            <span className="px-2 py-0.5 bg-primary-400/15 text-primary-300 rounded font-bold font-mono text-[9px]">
                              Room {b.assignedRoom}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 mt-0.5">{b.affiliation} &bull; Pass: <span className="font-mono text-slate-400 font-bold">{b.tempPassNo}</span></p>
                          <p className="text-[10px] text-slate-500 mt-1">Arrival Timestamp: {b.checkedInTime}</p>
                        </div>

                        <button
                          onClick={() => handleCheckOut(b.id)}
                          className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-black rounded-xl font-bold text-xs flex items-center gap-1 transition-all cursor-pointer border border-rose-500/20"
                        >
                          <LogOut size={14} />
                          Log Departure Check-out
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </GlassCard>

              {/* Security checkpoint entry log */}
              <GlassCard className="p-6 border-white/10">
                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-white font-bold font-display text-lg">Main Gate Entrance ledger</h3>
                    <p className="text-xs text-slate-500">Record all vehicle and walk-in arrivals.</p>
                  </div>
                  
                  {/* Gate ledger search */}
                  <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                    <input 
                      type="text" 
                      placeholder="Filter entry name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8 pr-4 py-1.5 bg-white/5 border border-white/5 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary-500 text-white"
                    />
                  </div>
                </div>

                {/* Add standard visitor directly */}
                <form onSubmit={handleAddGateRecord} className="flex flex-wrap gap-2 mb-6 p-3 bg-white/[0.01] rounded-xl border border-white/5">
                  <input 
                    type="text" 
                    required
                    placeholder="Visitor Name"
                    value={gateName}
                    onChange={(e) => setGateName(e.target.value)}
                    className="flex-1 min-w-[140px] p-2 bg-slate-900 border border-white/5 rounded-lg text-xs"
                  />
                  <input 
                    type="text" 
                    placeholder="Vehicle No"
                    value={gateVehicleNo}
                    onChange={(e) => setGateVehicleNo(e.target.value)}
                    className="w-28 p-2 bg-slate-900 border border-white/5 rounded-lg text-xs"
                  />
                  <input 
                    type="text" 
                    required
                    placeholder="Purpose of stay"
                    value={gatePurpose}
                    onChange={(e) => setGatePurpose(e.target.value)}
                    className="flex-1 min-w-[150px] p-2 bg-slate-900 border border-white/5 rounded-lg text-xs"
                  />
                  <button type="submit" className="px-4 py-2 bg-primary-400 text-black font-bold rounded-lg text-xs cursor-pointer">
                    Log Entry
                  </button>
                </form>

                <div className="space-y-3 font-mono text-xs">
                  {securityLedger
                    .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((s) => (
                      <div key={s.id} className="p-3 bg-slate-900/60 border border-white/5 rounded-xl flex justify-between items-center text-slate-300">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full shrink-0",
                              s.action === 'Entry' ? "bg-emerald-400" : "bg-rose-400"
                            )} />
                            <span className="font-bold text-slate-200">{s.name}</span>
                            <span className="text-[10px] text-slate-500">({s.passNo})</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">Vehicle: {s.vehicleNo} | Purpose: {s.purpose}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[9px] text-slate-500">{s.timestamp}</p>
                          <span className={cn(
                            "px-1.5 py-0.2 rounded text-[8px] font-black uppercase text-[10px]",
                            s.action === 'Entry' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                          )}>
                            {s.action}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </GlassCard>
            </div>
          )}

        </div>

        {/* --- RIGHT HAND PANELS (1-col span for universal status widgets) --- */}
        <div className="space-y-8">
          
          {/* Universal room state grid */}
          <GlassCard className="p-6 border-white/10">
            <h3 className="text-white font-bold font-display text-base mb-2">Visitor Rooms Occupancy</h3>
            <p className="text-xs text-slate-500 mb-5">Click on a room to toggle layout test states manually.</p>
            
            <div className="grid grid-cols-2 gap-3 font-mono">
              {rooms.map((room) => (
                <div
                  key={room.number}
                  onClick={() => handleToggleRoomStatus(room.number)}
                  className={cn(
                    "p-3 rounded-2xl border transition-all cursor-pointer relative",
                    room.status === 'Occupied' 
                      ? "bg-sky-500/10 border-sky-500/30 text-sky-200" 
                      : room.status === 'Cleaning Required' 
                      ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/20"
                  )}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">Room {room.number}</span>
                    <span className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      room.status === 'Occupied' ? "bg-sky-400" :
                      room.status === 'Cleaning Required' ? "bg-amber-400" : "bg-emerald-400"
                    )} />
                  </div>
                  <p className="text-[9px] text-slate-400 mt-1 uppercase font-black tracking-wider">{room.type}</p>
                  
                  {room.currentGuest && (
                    <p className="text-[9px] text-slate-300 font-sans mt-2 truncate max-w-full">
                      👤 {room.currentGuest}
                    </p>
                  )}
                  
                  <div className="absolute top-2 right-2 opacity-10 font-bold text-5xl select-none leading-none z-0">
                    {room.number.substring(0, 1)}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 flex gap-4 text-[10px] text-slate-400 justify-around bg-white/[0.01] p-3 rounded-xl border border-white/5">
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Vacant
              </span>
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400" /> Occupied
              </span>
              <span className="flex items-center gap-1.5 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Cleaning
              </span>
            </div>
          </GlassCard>

          {/* Key management safety compartment */}
          <GlassCard className="p-6 border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Key size={18} className="text-primary-400" />
              <h3 className="text-white font-bold font-display text-base">Key Locker Cabinet Hooks</h3>
            </div>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Legitimate guard safety ledger. Click key hook index to toggle custody status back and forth.
            </p>

            <div className="space-y-2.5 font-mono text-xs">
              {keys.map((k) => (
                <div 
                  key={k.roomNumber}
                  onClick={() => handleToggleKey(k.roomNumber)}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl flex justify-between items-center cursor-pointer transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Key size={14} className={cn(
                      k.status === 'In Ledger' ? "text-emerald-400" : "text-amber-500 rotate-45"
                    )} />
                    <span className="font-bold text-white">Hub Key {k.roomNumber}</span>
                  </div>
                  <span className={cn(
                    "px-2 py-0.5 text-[9px] uppercase font-bold rounded",
                    k.status === 'In Ledger' ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                  )}>
                    {k.status}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Quick FAQ / Rule Information */}
          <GlassCard className="p-5 border-white/5 bg-white/[0.01] text-xs space-y-4">
            <h4 className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle size={14} /> IISER Guest Rules Guidelines
            </h4>
            <div className="text-slate-400 space-y-2.5 leading-relaxed">
              <p>
                <strong>Check-out limits:</strong> Dynamic mandatory check-out time is preset to 11:00 AM.
              </p>
              <p>
                <strong>Subsidy rates:</strong> Subsidized bookings are eligible exclusively under vetted official departments (Physics, Chemistry, Biology, Math).
              </p>
              <p>
                <strong>Authentication:</strong> Google OAuth guarantees secure institutional credentials log integrity.
              </p>
            </div>
          </GlassCard>

        </div>

      </div>

    </div>
  );
}
