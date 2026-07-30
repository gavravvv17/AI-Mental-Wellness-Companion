import React, { useState, useEffect } from 'react';
import API from '../services/api';
import {
  Users, Plus, Trash2, AlertTriangle, CheckCircle,
  Phone, Mail, User, Send, Heart, ShieldCheck, X
} from 'lucide-react';

const TrustedCircle = () => {
  const [contacts, setContacts] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [alertSuccess, setAlertSuccess] = useState(null);
  const [contactSuccess, setContactSuccess] = useState(false);

  const fetchContacts = async () => {
    try { const r = await API.get('/circle/contacts'); setContacts(r.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };
  useEffect(() => { fetchContacts(); }, []);

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await API.post('/circle/contact', { name, email, phone });
      setName(''); setEmail(''); setPhone('');
      setContactSuccess(true); setTimeout(() => setContactSuccess(false), 2500);
      fetchContacts();
    } catch (err) { console.error(err); }
  };

  const handleDeleteContact = async (id) => {
    if (!window.confirm('Remove this contact from your Trusted Circle?')) return;
    try { await API.delete(`/circle/contact/${id}`); fetchContacts(); }
    catch (err) { console.error(err); }
  };

  const triggerAlert = async () => {
    try {
      const r = await API.post('/circle/alert');
      setAlertSuccess(r.data.message);
      setTimeout(() => setAlertSuccess(null), 8000);
    } catch (err) { console.error(err); }
  };

  const avatarColors = [
    ['#f5f0ff','#8b5cf6'], ['#cdeccf','#388e3c'], ['#dbeeff','#0ea5e9'],
    ['#ffe5d4','#f97316'], ['#fff4c7','#d97706'], ['#fecaca','#ef4444'],
  ];

  if (loading) return (
    <div className="space-y-4 animate-pulse max-w-4xl mx-auto">
      <div className="skeleton h-10 w-64 rounded-2xl" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="skeleton h-64 rounded-3xl" />
        <div className="skeleton h-64 lg:col-span-2 rounded-3xl" />
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 page-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-ink-800">Trusted Circle 🫂</h2>
          <p className="text-sm text-ink-400 mt-1">Build your safety net of people you trust.</p>
        </div>
        {contacts.length > 0 && (
          <button onClick={triggerAlert}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold text-white transition-all hover:shadow-lg"
            style={{ background:'linear-gradient(135deg,#f97316,#ef4444)', boxShadow:'0 4px 14px rgba(249,115,22,0.25)' }}>
            <Send className="w-4 h-4" /> Send Support Alert
          </button>
        )}
      </div>

      {/* Broadcast success */}
      {alertSuccess && (
        <div className="p-5 rounded-2xl animate-scale-in space-y-1"
          style={{ background:'#f0faf0', border:'1.5px solid #a8d9ab' }}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" style={{ color:'#388e3c' }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color:'#388e3c' }}>Alert Simulated</span>
          </div>
          <p className="text-sm text-ink-700 font-medium">{alertSuccess}</p>
          <p className="text-[10px] text-ink-400">In production, this sends SMS (Twilio) or email (SendGrid) to all contacts.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">

        {/* Add Contact */}
        <div className="card p-6 space-y-4" style={{ borderRadius:'24px' }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'#f5f0ff' }}>
              <Plus className="w-4 h-4" style={{ color:'#8b5cf6' }} />
            </div>
            <h3 className="font-bold text-sm text-ink-800">Add Someone You Trust</h3>
          </div>

          {contactSuccess && (
            <div className="p-3.5 rounded-2xl flex items-center gap-2 text-xs animate-scale-in"
              style={{ background:'#f0faf0', border:'1px solid #a8d9ab', color:'#388e3c' }}>
              <CheckCircle className="w-4 h-4 flex-shrink-0" /> Added to your circle! 🌱
            </div>
          )}

          <form onSubmit={handleAddContact} className="space-y-3">
            {[
              { label:'Name',  icon:User,  type:'text',  val:name,  set:setName,  ph:'Contact name',      req:true },
              { label:'Email', icon:Mail,  type:'email', val:email, set:setEmail, ph:'email@example.com', req:true },
              { label:'Phone', icon:Phone, type:'text',  val:phone, set:setPhone, ph:'+1 555 000 0000',   req:true },
            ].map(({ label, icon:Icon, type, val, set, ph, req }) => (
              <div key={label}>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-ink-400 mb-1">{label}</label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-300" />
                  <input type={type} required={req} value={val} onChange={e => set(e.target.value)} placeholder={ph}
                    className="w-full pl-9 pr-3 py-2.5 field text-ink-800 text-xs" />
                </div>
              </div>
            ))}
            <button type="submit" disabled={!name.trim()} className="w-full btn-ghost disabled:opacity-40"
              style={{ borderColor:'#dccef9', color:'#8b5cf6' }}>
              Add to Circle
            </button>
          </form>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Contacts */}
          <div className="card p-6 space-y-4" style={{ borderRadius:'24px' }}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-ink-800">Your Support Network</h3>
              <span className="text-xs text-ink-400 font-medium">{contacts.length} {contacts.length === 1 ? 'person' : 'people'}</span>
            </div>

            {contacts.length === 0 ? (
              <div className="text-center py-10 rounded-2xl border-2 border-dashed border-warm-200">
                <span className="text-5xl block mb-3">🤝</span>
                <p className="text-xs text-ink-400 max-w-xs mx-auto leading-relaxed">
                  Add trusted friends, family, or a therapist to build your personal safety net.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contacts.map((contact, i) => {
                  const [bg, text] = avatarColors[i % avatarColors.length];
                  return (
                    <div key={contact.id} className="flex items-center justify-between p-4 rounded-2xl border-2 group"
                      style={{ background:'#FAFAF7', borderColor:'#EEF0F5' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-base font-bold flex-shrink-0"
                          style={{ background: bg, color: text }}>
                          {contact.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-ink-800">{contact.name}</p>
                          <p className="text-[10px] text-ink-400 flex items-center gap-1">
                            <Mail className="w-2.5 h-2.5" /> {contact.email}
                          </p>
                          <p className="text-[10px] text-ink-400 flex items-center gap-1">
                            <Phone className="w-2.5 h-2.5" /> {contact.phone}
                          </p>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteContact(contact.id)}
                        className="p-2 rounded-xl text-ink-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 border border-transparent hover:border-red-200">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Disclaimer + Crisis */}
          <div className="card p-6 space-y-4" style={{ borderRadius:'24px' }}>
            <div className="flex items-center gap-2">
              <Heart className="w-4 h-4 fill-rose-400 text-rose-400" />
              <h3 className="font-bold text-sm text-ink-800">Serenity Disclaimer</h3>
            </div>
            <p className="text-xs text-ink-500 leading-relaxed">
              Serenity is a <strong className="text-ink-700">self-care companion</strong> for mood tracking and journaling — not a clinical tool. Always consult a licensed professional for mental health concerns.
            </p>

            <div className="border-t border-warm-100 pt-4 space-y-3">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-500">24/7 Crisis Support</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { flag:'🇺🇸', country:'USA / Canada', line:'Suicide & Crisis Lifeline', contact:'Call or Text 988', href:'tel:988' },
                  { flag:'🇮🇳', country:'India (Vandrevala)', line:'24hr Mental Health Helpline', contact:'+91 9999 666 555', href:'tel:+919999666555' },
                ].map(({ flag, country, line, contact, href }) => (
                  <div key={country} className="p-4 rounded-2xl space-y-1"
                    style={{ background:'#fff5f5', border:'1px solid #fecaca' }}>
                    <p className="text-xs font-bold text-ink-700">{flag} {country}</p>
                    <p className="text-[10px] text-ink-400">{line}</p>
                    <a href={href} className="text-sm font-bold hover:underline" style={{ color:'#ef4444' }}>{contact}</a>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TrustedCircle;
