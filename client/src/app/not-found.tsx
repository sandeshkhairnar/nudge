"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="max-w-md w-full bg-white p-8 md:p-12 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 flex flex-col items-center"
      >
        <div className="w-16 h-16 bg-gray-100 text-gray-900 rounded-2xl flex items-center justify-center mb-6">
          <span className="text-xl font-bold">404</span>
        </div>
        
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-3">
          Page not found
        </h1>
        
        <p className="text-sm text-gray-500 font-medium mb-8 leading-relaxed">
          Sorry, we couldn't find the page you were looking for. It might have been moved or deleted.
        </p>
        
        <Link href="/" className="w-full">
          <motion.button 
            whileHover={{ y: -2, boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)" }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-md flex justify-center items-center gap-2"
          >
            <ArrowLeft size={18} /> Back to Dashboard
          </motion.button>
        </Link>
      </motion.div>
    </div>
  );
}
