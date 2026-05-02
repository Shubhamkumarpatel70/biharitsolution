import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../axios';
import Barcode from 'react-barcode';

const PublicIDCard = () => {
  const { id } = useParams();
  const [idCard, setIdCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchIDCard = async () => {
      try {
        const response = await axios.get(`/api/auth/public/id-cards/${id}`);
        setIdCard(response.data.idCard);
      } catch (err) {
        console.error('Error fetching ID card:', err);
        setError('ID Card not found or has been removed.');
      } finally {
        setLoading(false);
      }
    };
    fetchIDCard();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !idCard) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-4">
        <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 max-w-md">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error || 'Something went wrong.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-12">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Digital ID Verification</h1>
          <p className="text-slate-500">Official digital identification card issued by ASKC Digital Web</p>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
          {/* Front Side */}
          <div className="w-[320px] h-[500px] bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden relative flex flex-col items-center">
            {/* Header Curve */}
            <div className="absolute top-0 left-0 right-0 h-40 bg-[#0f172a] rounded-b-[3rem]">
              <div className="pt-8 px-6 text-center">
                <h2 className="text-white font-bold tracking-widest text-lg">IDENTITY CARD</h2>
                <div className="w-12 h-1 bg-sky-400 mx-auto mt-1 rounded-full opacity-60"></div>
              </div>
            </div>

            {/* Profile Section */}
            <div className="mt-20 z-10">
              <div className="w-36 h-36 rounded-full border-[6px] border-white shadow-xl overflow-hidden bg-slate-100 ring-4 ring-sky-400/20">
                {idCard.photo ? (
                  <img src={idCard.photo} alt={idCard.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                    <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="mt-8 px-6 text-center w-full">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1 uppercase">{idCard.name}</h3>
              <p className="text-sky-600 font-bold text-sm tracking-widest uppercase mb-6">{idCard.role}</p>
              
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-0.5">ID Number</p>
                  <p className="text-lg font-black text-slate-800 tracking-wider tabular-nums">{idCard.idNumber}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-auto w-full h-12 bg-slate-900 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold tracking-[0.2em] uppercase opacity-70">Official Member</span>
            </div>
          </div>

          {/* Back Side */}
          <div className="w-[320px] h-[500px] bg-white rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden relative flex flex-col p-8">
             <div className="text-center mb-8">
              <div className="text-xl font-black text-slate-900 tracking-tighter mb-1">
                ASKC <span className="text-sky-600">Digital Web</span>
              </div>
              <div className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">Verified Institution</div>
            </div>

            <div className="space-y-6 flex-1">
              <div className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Office Location</p>
                <p className="text-xs font-bold text-slate-800 leading-relaxed">
                  Bihar IT Solution, <br />
                  Main Road, Near City Center, <br />
                  Patna, Bihar - 800001
                </p>
              </div>

              <div className="space-y-1.5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Digital Contact</p>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">info@askcweb.in</p>
                  <p className="text-xs font-bold text-slate-800">www.askcweb.in</p>
                </div>
              </div>
            </div>

            {/* Barcode Section */}
            <div className="mt-8 mb-8 flex flex-col items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <div className="w-full flex justify-center scale-90 sm:scale-100">
                <Barcode 
                  value={idCard.idNumber} 
                  height={40} 
                  width={1.2} 
                  fontSize={12}
                  background="transparent"
                />
              </div>
            </div>

            <div className="mt-auto text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-4">Follow Us</p>
            </div>

            <div className="absolute bottom-6 left-0 right-0 px-8">
              <div className="flex items-center justify-between gap-4 py-3 border-t border-slate-100">
                <div className="w-20 h-0.5 bg-slate-100 rounded-full"></div>
                <div className="text-[9px] font-black text-slate-300 tracking-widest uppercase">ASKCDW</div>
                <div className="w-20 h-0.5 bg-slate-100 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center pt-8">
          <p className="text-slate-400 text-xs">Scan the barcode to verify credentials on our official portal.</p>
          <p className="text-slate-400 text-xs mt-1">© {new Date().getFullYear()} ASKC Digital Web. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default PublicIDCard;
