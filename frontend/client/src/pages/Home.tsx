import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import AdminDashboard from "./AdminDashboard";
import { LogIn, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { AmbientGlow, BrandSpinner } from "@/components/animations";

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();

  // If user is authenticated, show the dashboard
  if (isAuthenticated && user) {
    return (
      <DashboardLayout activeSection="dashboard">
        <AdminDashboard />
      </DashboardLayout>
    );
  }

  // If not authenticated, show login prompt
  if (!loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        <AmbientGlow />
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-md w-full text-center relative z-10"
        >
          <motion.img 
            src="/eusotrip-logo.png" 
            alt="EusoTrip Logo" 
            className="w-24 h-24 mx-auto mb-6 object-contain"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ scale: 1.08, rotate: 5 }}
          />
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-4xl font-bold bg-gradient-to-r from-[#1473FF] to-[#BE01FF] bg-clip-text text-transparent mb-4"
          >
            EusoTrip
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="text-slate-400 mb-8"
          >
            Freight & Energy Logistics Platform
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.a
              href="/login"
              whileHover={{ scale: 1.04, boxShadow: "0 8px 30px rgba(20, 115, 255, 0.3), 0 0 40px rgba(190, 1, 255, 0.15)" }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#1473FF] to-[#BE01FF] text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/20 transition"
            >
              <LogIn className="w-5 h-5" />
              Sign In
            </motion.a>
            <motion.a
              href="/register"
              whileHover={{ scale: 1.04, borderColor: "rgba(255,255,255,0.4)" }}
              whileTap={{ scale: 0.96 }}
              className="inline-flex items-center gap-2 border border-white/20 text-slate-300 hover:text-white hover:border-white/40 px-8 py-3 rounded-xl font-semibold transition"
            >
              Create Account
            </motion.a>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center relative overflow-hidden">
      <AmbientGlow />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center relative z-10"
      >
        <BrandSpinner size={48} />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-slate-400 mt-4"
        >
          Loading...
        </motion.p>
      </motion.div>
    </div>
  );
}

