// import type { ProviderData } from "../_types/ProviderProfile.types";

// export default function ProviderBio({profile}: ProviderData) {
//     if (!profile)
//         return null;
//     return (
//         <div className="bg-slate-800/20 border border-slate-800 rounded-[2rem] p-6 md:p-8 backdrop-blur-md relative overflow-hidden">
//             <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
//             <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 relative z-10">
//                 <div className="space-y-4 max-w-2xl">
//                     {/* Specialty Status Indicators */}
//                     <div className="flex flex-wrap items-center gap-3">
//                         <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
//                             <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
//                             <span className="text-[11px] font-black text-emerald-400 uppercase tracking-wider">
//                                 {profile.}
//                             </span>
//                         </div>
//                         {isVerified === "VERIFIED" && (
//                             <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-tight">
//                                 ✓ Verified Expert
//                             </span>
//                         )}
//                     </div>
//                     <div className="space-y-2">
//                         <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Professional Biography</h3>
//                         <p className="text-slate-300 text-sm leading-relaxed font-normal whitespace-pre-line">
//                             {profile || "No professional overview statement written for this profile instance yet."}
//                         </p>
//                     </div>
//                 </div>
//             </div>
//         </div>
//   )
// }
