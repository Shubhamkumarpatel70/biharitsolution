import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import axios from 'axios';
import Barcode from 'react-barcode';

const AdminIDCard = () => {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [photo, setPhoto] = useState('https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80');
  const [idCards, setIdCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const frontRef = useRef(null);
  const backRef = useRef(null);
  const modalFrontRef = useRef(null);
  const modalBackRef = useRef(null);

  useEffect(() => {
    fetchIDCards();
    // Auto-generate ID number if empty
    if (!idNumber) {
      generateDynamicID();
    }
  }, []);

  const generateDynamicID = () => {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    setIdNumber(`ASKCDW${year}${randomNum}`);
  };

  const fetchIDCards = async () => {
    try {
      const res = await axios.get('/api/auth/admin/id-cards');
      setIdCards(res.data.idCards);
    } catch (err) {
      console.error('Error fetching ID cards:', err);
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhoto(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!name || !role || !idNumber) {
      alert('Please fill all fields');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/auth/admin/id-cards', {
        name,
        role,
        idNumber,
        photo
      });
      alert('ID Card saved successfully');
      fetchIDCards();
      // Reset form
      setName('');
      setRole('');
      generateDynamicID();
    } catch (err) {
      console.error('Error saving ID card:', err);
      alert('Failed to save ID card');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this ID card?')) return;
    try {
      await axios.delete(`/api/auth/admin/id-cards/${id}`);
      fetchIDCards();
    } catch (err) {
      console.error('Error deleting ID card:', err);
    }
  };

  const downloadCard = async (side, ref) => {
    const element = ref ? ref.current : (side === 'front' ? frontRef.current : backRef.current);
    if (!element) return;

    try {
      const canvas = await html2canvas(element, { scale: 3, useCORS: true, backgroundColor: null });
      const link = document.createElement('a');
      link.download = `askc-id-card-${side}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Error generating card image:', err);
    }
  };

  const handleShare = async () => {
    if (!selectedCard) return;
    
    const shareUrl = `${window.location.origin}/id-card/verify/${selectedCard._id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ASKC Digital Web ID Card',
          text: `Digital ID Verification for ${selectedCard.name}`,
          url: shareUrl
        });
      } catch (err) {
        console.error('Error sharing:', err);
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Verification link copied to clipboard!');
    }).catch(err => {
      console.error('Could not copy text: ', err);
      alert(`Share link: ${text}`);
    });
  };

  const openViewModal = (card) => {
    setSelectedCard(card);
    setShowModal(true);
  };

  const closeViewModal = () => {
    setSelectedCard(null);
    setShowModal(false);
  };

  const CardFront = ({ cardData, reference }) => (
    <div className="id-card-wrapper" ref={reference}>
      <div className="front-header-bg"></div>
      <div className="front-content">
        <h2 className="header-title">IDENTITY CARD</h2>
        <div className="header-line"></div>
        
        <div className="photo-container">
          <img src={cardData.photo || photo} alt="Profile Photo" />
        </div>
        
        <div className="details">
          <h2 className="employee-name">{cardData.name || "SHUBHAM KUMAR"}</h2>
          <div className="employee-title">{cardData.role || "FOUNDER"}</div>
          
          <div className="id-section">
            <p className="id-label">ID Number</p>
            <div className="id-number-text">{cardData.idNumber || idNumber || "ASKCDW20267062"}</div>
          </div>
        </div>

        <div className="front-footer">
          <span className="footer-text">OFFICIAL MEMBER</span>
        </div>
      </div>
    </div>
  );

  const CardBack = ({ cardData, reference }) => (
    <div className="id-card-wrapper" ref={reference}>
      <div className="id-back">
        <div className="back-logo-section">
          <div className="back-logo-text">ASKC <span>Digital Web</span></div>
          <div className="back-logo-sub">Verified Institution</div>
        </div>
        
        <div className="info-box">
          <span className="info-label">Office Location</span>
          <p className="info-text">
            Bihar IT Solution,<br/>
            Main Road, Near City Center,<br/>
            Patna, Bihar - 800001
          </p>
        </div>

        <div className="info-box">
          <span className="info-label">Digital Contact</span>
          <div className="info-text">
            support@askcweb.in<br/>
            www.askcweb.in
          </div>
        </div>

        <div className="barcode-section">
          <div className="barcode-wrapper">
            <Barcode 
              value={cardData.idNumber || idNumber || "ASKCDW20267062"} 
              height={40} 
              width={1.2} 
              displayValue={false}
              background="transparent"
            />
          </div>
          <div className="barcode-number">{cardData.idNumber || idNumber || "ASKCDW20267062"}</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="id-card-generator p-6 w-full max-w-7xl mx-auto">
      <style>{`
        .id-card-generator {
          display: flex;
          flex-direction: column;
          align-items: center;
          font-family: 'Inter', sans-serif;
          color: white;
          box-sizing: border-box;
        }

        .generator-title {
          margin-bottom: 30px;
          text-align: center;
          font-size: 28px;
        }

        .generator-layout {
          display: flex;
          gap: 50px;
          flex-wrap: wrap;
          justify-content: center;
          align-items: flex-start;
          width: 100%;
          margin-bottom: 50px;
        }

        .form-container {
          background: #1e293b;
          padding: 25px;
          border-radius: 12px;
          width: 320px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        }

        .form-container label {
          display: block;
          margin-bottom: 8px;
          font-size: 13px;
          color: #94a3b8;
        }

        .form-container input {
          width: 100%;
          padding: 12px;
          margin-bottom: 15px;
          border-radius: 6px;
          border: 1px solid #334155;
          background: #0f172a;
          color: white;
          outline: none;
          box-sizing: border-box;
          font-family: 'Inter', sans-serif;
        }

        .form-container input:focus {
          border-color: #3b82f6;
        }

        .btn-save {
          width: 100%;
          padding: 12px;
          background: #3b82f6;
          border: none;
          color: white;
          font-weight: bold;
          cursor: pointer;
          border-radius: 6px;
          font-family: 'Inter', sans-serif;
          transition: background 0.2s;
          margin-top: 5px;
        }

        .btn-save:hover {
          background: #2563eb;
        }

        .btn-save:disabled {
          background: #64748b;
          cursor: not-allowed;
        }

        /* CARD DESIGN STYLES - PRECISE MATCH TO IMAGE */
        .id-card-wrapper {
          width: 350px;
          height: 520px;
          border-radius: 40px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.15);
          position: relative;
          overflow: hidden;
          background-color: #ffffff;
          flex-shrink: 0;
          color: #0f172a;
        }

        /* FRONT DESIGN */
        .id-front {
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
        }

        .front-header-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 180px;
          background-color: #0f172a;
          border-bottom-left-radius: 60px;
          border-bottom-right-radius: 60px;
          z-index: 1;
        }

        .front-content {
          position: relative;
          z-index: 10;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .header-title {
          color: white;
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 2px;
          margin-top: 40px;
          text-transform: uppercase;
        }

        .header-line {
          width: 40px;
          height: 3px;
          background-color: #3b82f6;
          margin-top: 8px;
          border-radius: 2px;
          opacity: 0.8;
        }

        .photo-container {
          width: 160px;
          height: 160px;
          border-radius: 50%;
          border: 6px solid #ffffff;
          margin-top: 25px;
          overflow: hidden;
          background-color: #fff;
          display: flex;
          justify-content: center;
          align-items: center;
          box-shadow: 0 10px 25px rgba(59, 130, 246, 0.25);
          position: relative;
        }
        
        .photo-container::after {
          content: "";
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 4px solid #3b82f6;
          opacity: 0.3;
        }

        .photo-container img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .details {
          margin-top: 40px;
          text-align: center;
          width: 100%;
          padding: 0 20px;
        }
        
        .employee-name {
          font-size: 26px;
          font-weight: 900;
          margin: 0;
          color: #0f172a;
          letter-spacing: -0.5px;
          text-transform: uppercase;
        }
        
        .employee-title {
          font-size: 16px;
          color: #3b82f6;
          margin: 6px 0 35px 0;
          font-weight: 700;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }
        
        .id-section {
          border-top: 1px solid #f1f5f9;
          padding-top: 25px;
          width: 100%;
        }

        .id-label {
          font-size: 11px;
          color: #94a3b8;
          margin: 0 0 6px 0;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .id-number-text {
          color: #0f172a;
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 1.5px;
        }

        .front-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 45px;
          background-color: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          border-top-left-radius: 15px;
          border-top-right-radius: 15px;
        }
        
        .footer-text {
          color: white;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 2px;
          text-transform: uppercase;
          opacity: 0.9;
        }

        /* BACK DESIGN */
        .id-back {
          background-color: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          padding: 30px 25px;
          box-sizing: border-box;
        }

        .back-logo-section {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .back-logo-text {
          font-size: 22px;
          font-weight: 900;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .back-logo-text span {
          color: #3b82f6;
        }
        
        .back-logo-sub {
          font-size: 11px;
          color: #94a3b8;
          font-weight: 800;
          letter-spacing: 1.5px;
          text-transform: uppercase;
          margin-top: 4px;
        }

        .info-box {
          width: 100%;
          background-color: #f8fafc;
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 15px;
        }
        
        .info-label {
          font-size: 10px;
          color: #94a3b8;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 12px;
          display: block;
        }
        
        .info-text {
          font-size: 13px;
          color: #0f172a;
          font-weight: 700;
          line-height: 1.6;
        }

        .barcode-section {
          margin-top: auto;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-bottom: 10px;
        }
        
        .barcode-wrapper {
          background: white;
          padding: 5px;
          border-radius: 8px;
          margin-bottom: 5px;
          transform: scale(1.1);
        }
        
        .barcode-number {
          font-size: 11px;
          font-weight: 700;
          color: #0f172a;
          letter-spacing: 1px;
        }

        /* TABLE STYLES */
        .saved-cards-section {
          width: 100%;
          background: #1e293b;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.5);
          margin-top: 20px;
        }

        .saved-cards-title {
          font-size: 22px;
          margin-bottom: 20px;
          color: #3b82f6;
          border-bottom: 1px solid #334155;
          padding-bottom: 10px;
        }

        .cards-table-container {
          overflow-x: auto;
        }

        .cards-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .cards-table th {
          padding: 12px;
          border-bottom: 2px solid #334155;
          color: #94a3b8;
          font-size: 14px;
        }

        .cards-table td {
          padding: 12px;
          border-bottom: 1px solid #334155;
          font-size: 14px;
        }

        .btn-view {
          padding: 6px 12px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 8px;
        }

        .btn-delete {
          padding: 6px 12px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        /* MODAL STYLES */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.85);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: 20px;
          overflow-y: auto;
        }

        .modal-content {
          background: #1e293b;
          padding: 30px;
          border-radius: 15px;
          max-width: 900px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          margin-top: auto;
          margin-bottom: auto;
        }

        .modal-cards {
          display: flex;
          gap: 30px;
          flex-wrap: wrap;
          justify-content: center;
          margin-bottom: 25px;
        }

        .modal-actions {
          display: flex;
          gap: 15px;
          width: 100%;
          justify-content: center;
          flex-wrap: wrap;
        }

        .btn-modal {
          padding: 12px 25px;
          border: none;
          border-radius: 8px;
          font-weight: bold;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          min-width: 120px;
        }

        .btn-cancel {
          background: #475569;
          color: white;
        }

        .btn-download-modal {
          background: #10b981;
          color: white;
        }

        .btn-share {
          background: #8b5cf6;
          color: white;
        }
        
        @media (max-width: 768px) {
          .modal-content {
            padding: 15px;
          }
          .modal-cards {
            gap: 15px;
          }
          .id-card-wrapper {
            transform: scale(0.85);
            margin: -40px 0;
          }
          .modal-actions {
            flex-direction: column;
            gap: 10px;
          }
          .btn-modal {
            width: 100%;
          }
        }
      `}</style>

      <h1 className="generator-title font-bold text-slate-100 flex items-center gap-3">
        <span className="p-2 bg-blue-500/20 rounded-lg">
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm5 3a2 2 0 100-4 2 2 0 000 4z" />
          </svg>
        </span>
        Admin ID Card Generator
      </h1>
      
      <div className="generator-layout">
        <div className="form-container">
          <label>Employee Name</label>
          <input 
            type="text" 
            placeholder="Enter full name" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
          
          <label>Job Position</label>
          <input 
            type="text" 
            placeholder="Enter position" 
            value={role} 
            onChange={(e) => setRole(e.target.value)} 
          />
          
          <label>Employee ID No.</label>
          <input 
            type="text" 
            placeholder="e.g. ASKCDW2025001" 
            value={idNumber} 
            onChange={(e) => setIdNumber(e.target.value)} 
          />
          
          <label>Upload Photo</label>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handlePhotoChange} 
            style={{ padding: '8px' }}
          />

          <button 
            className="btn-save" 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save to Database'}
          </button>
          
          <div className="download-btns">
            <button className="btn-download" onClick={() => downloadCard('front')}>Download Front</button>
            <button className="btn-download" style={{ background: '#6366f1' }} onClick={() => downloadCard('back')}>Download Back</button>
          </div>
        </div>

        <div className="cards-preview">
          <CardFront cardData={{ name, role, idNumber, photo }} reference={frontRef} />
          <CardBack cardData={{ name, role, idNumber }} reference={backRef} />
        </div>
      </div>

      <div className="saved-cards-section">
        <h2 className="saved-cards-title">Managed ID Cards</h2>
        <div className="cards-table-container">
          <table className="cards-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Role</th>
                <th>ID Number</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {idCards.map(card => (
                <tr key={card._id}>
                  <td>
                    <img 
                      src={card.photo || 'https://via.placeholder.com/40'} 
                      alt={card.name} 
                      className="w-10 h-10 rounded-full object-cover border border-slate-700"
                    />
                  </td>
                  <td>{card.name}</td>
                  <td>{card.role}</td>
                  <td className="font-mono text-blue-400">{card.idNumber}</td>
                  <td>{new Date(card.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn-view" onClick={() => openViewModal(card)}>View</button>
                    <button className="btn-delete" onClick={() => handleDelete(card._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {idCards.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                    No ID cards generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && selectedCard && (
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="saved-cards-title w-full text-center mb-6">ID Card Preview</h2>
            
            <div className="modal-cards">
              <CardFront cardData={selectedCard} reference={modalFrontRef} />
              <CardBack cardData={selectedCard} reference={modalBackRef} />
            </div>

            <div className="modal-actions">
              <button className="btn-modal btn-download-modal" onClick={() => downloadCard('front', modalFrontRef)}>Download Front</button>
              <button className="btn-modal btn-download-modal" style={{ background: '#6366f1' }} onClick={() => downloadCard('back', modalBackRef)}>Download Back</button>
              <button className="btn-modal btn-share" onClick={handleShare}>Share Link</button>
              <button className="btn-modal btn-cancel" onClick={closeViewModal}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminIDCard;
