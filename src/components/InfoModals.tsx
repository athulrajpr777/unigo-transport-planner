import React from 'react';
import { motion } from 'motion/react';
import { X, CheckCircle2, TrendingDown, Globe } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'about' | 'impact';
}

export const InfoModals: React.FC<ModalProps> = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;

  return (
    <div
      id="info-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
    >
      <motion.div
        id="info-modal-container"
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0E202B]/85 backdrop-blur-xl text-[#E2E8F0] w-full max-w-xl rounded-2xl border border-[#1E4357]/75 shadow-2xl shadow-black overflow-hidden max-h-[90vh] flex flex-col gpu-smooth"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1E4357]/75 bg-[#0A1822]/85">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#07161F]/80 border border-[#C5A869] text-[#C5A869] flex items-center justify-center shadow-xs">
              {type === 'impact' ? <TrendingDown className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
            </div>
            <h3 className="text-base font-bold text-[#FAF6EC]">
              {type === 'impact' ? 'Emission Calculation & Impact Logic' : 'About UniGo'}
            </h3>
          </div>
          <button
            id="close-info-modal-btn"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-[#8BA59B] hover:text-[#FAF6EC] hover:bg-[#16352B] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-xs text-[#C5D5D1] leading-relaxed">
          {type === 'impact' ? (
            <>
              <div className="bg-[#142F25]/75 backdrop-blur-sm border border-[#C5A869]/30 p-4 rounded-xl text-[#FAF6EC]">
                <p className="font-bold text-sm mb-1 text-[#C5A869]">
                  How Carbon Footprint is Measured
                </p>
                <p className="text-[#B5C7C1]">
                  We calculate greenhouse gas (GHG) emission savings by comparing multi-modal sustainable routes against an average single-occupant passenger petrol/diesel car in Indian urban traffic.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-[#FAF6EC] text-sm">Mode Emission Benchmarks:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-3 bg-[#0A1C16]/75 backdrop-blur-xs border border-[#1E4537]/75 rounded-xl">
                    <p className="font-bold text-[#FAF6EC]">Solo Car Baseline</p>
                    <p className="text-[#E07A7A] font-bold text-sm">~155g CO2 / km</p>
                    <p className="text-[10px] text-[#8BA59B]">Standard BS-VI ICE petrol car in city stop-and-go conditions</p>
                  </div>
                  <div className="p-3 bg-[#0A1C16]/75 backdrop-blur-xs border border-[#C5A869]/40 rounded-xl">
                    <p className="font-bold text-[#DFCCA3]">Bicycle & Walking</p>
                    <p className="text-[#5EEAD4] font-bold text-sm">0g CO2 / km</p>
                    <p className="text-[10px] text-[#8BA59B]">True zero-tailpipe human-powered transit</p>
                  </div>
                  <div className="p-3 bg-[#0A1C16]/75 backdrop-blur-xs border border-[#1E4537]/75 rounded-xl">
                    <p className="font-bold text-[#FAF6EC]">Electric Metro Rail</p>
                    <p className="text-[#93C5FD] font-bold text-sm">~22g CO2 / passenger-km</p>
                    <p className="text-[10px] text-[#8BA59B]">Regenerative braking + dedicated solar feeder arrays</p>
                  </div>
                  <div className="p-3 bg-[#0A1C16]/75 backdrop-blur-xs border border-[#1E4537]/75 rounded-xl">
                    <p className="font-bold text-[#FAF6EC]">Electric Transit Bus</p>
                    <p className="text-[#D5BE8A] font-bold text-sm">~25g CO2 / passenger-km</p>
                    <p className="text-[10px] text-[#8BA59B]">DTC / BMTC / BEST electric fleet at high capacity</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#1E4537]/75 pt-3">
                <h4 className="font-bold text-[#FAF6EC] mb-1">Why Eco-Friendly Comes First:</h4>
                <p className="text-[#8BA59B]">
                  Prioritizing the <strong className="text-[#C5A869]">Eco-Friendly</strong> multimodal combination ensures maximum decarbonization of urban transit corridors, cleaner breathable air for Indian metropolitan areas, and reduced gridlock.
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-[#FAF6EC]">
                <strong className="text-[#C5A869]">UniGo</strong> is an intelligent, AI-powered sustainable transport planner designed to help citizens and travelers explore clean, multi-modal travel options throughout India.
              </p>
              <div className="space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#C5A869] shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-[#FAF6EC]">Targeted Search:</strong> Start typing any locality, metro station, tech park, railway hub, or airport in India to see clean matching destinations.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#C5A869] shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-[#FAF6EC]">Contextual Transit Understanding:</strong> Powered by Gemini AI, you can plan journeys across Delhi NCR, Mumbai, Bengaluru, Chennai, Hyderabad, Kolkata, Pune, Ahmedabad, and beyond with accurate real-world stations and lines.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#C5A869] shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-[#FAF6EC]">Multimodal Synergy:</strong> Seamlessly balances solar-powered electric metros, smart bicycle share schemes, AC electric buses, and shared e-rickshaws.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#C5A869] shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-[#FAF6EC]">Priority Tailored:</strong> Select from Eco-Friendly, Fastest, Cheapest, and Convenient options with live carbon footprint savings and accurate duration calculations.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="px-6 py-4 bg-[#0D221B]/75 border-t border-[#1E4537]/75 flex justify-end">
          <button
            id="close-info-btn"
            type="button"
            onClick={onClose}
            className="bg-gradient-to-r from-[#A68A4E] via-[#C5A869] to-[#B59858] text-[#0A1C16] font-bold px-5 py-2 rounded-xl text-xs hover:brightness-110 transition-all cursor-pointer border border-[#C5A869]"
          >
            Got It
          </button>
        </div>
      </motion.div>
    </div>
  );
};
