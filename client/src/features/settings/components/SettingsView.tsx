import React, { useState, useEffect } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { fetchUserOrders } from "../../../services/orders.service";
import type { Order } from "../../../services/orders.service";

const API_URL = import.meta.env.VITE_API_URL || "/api";

// Iconos
const IconUser = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
const IconMap = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const IconCard = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>;
const IconAlert = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;

export default function SettingsView() {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");

  // Profile Form State
  const [profileData, setProfileData] = useState({ name: "", email: "", phone: "", addresses: [] as string[], currentPassword: "", password: "", confirmPassword: "" });
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: "", text: "" });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Payments State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Danger Zone State
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState("");

  useEffect(() => {
    if (!token || !user) return;
    
    // Cargar perfil completo
    fetch(`${API_URL}/users/${encodeURIComponent(user.email)}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setProfileData({
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          addresses: data.addresses || [],
          currentPassword: "",
          password: "",
          confirmPassword: ""
        });
        setLoadingProfile(false);
      })
      .catch(() => setLoadingProfile(false));
  }, [token, user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    if (profileData.password) {
      if (profileData.password.length < 6) {
        setProfileMsg({ type: "error", text: "La nueva contraseña debe tener al menos 6 caracteres" });
        return;
      }
      if (profileData.password !== profileData.confirmPassword) {
        setProfileMsg({ type: "error", text: "Las contraseñas nuevas no coinciden" });
        return;
      }
      if (!profileData.currentPassword) {
        setProfileMsg({ type: "error", text: "Debes ingresar tu contraseña actual para cambiarla" });
        return;
      }
    }
    
    setSavingProfile(true);
    setProfileMsg({ type: "", text: "" });

    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          phone: profileData.phone,
          addresses: profileData.addresses,
          currentPassword: profileData.currentPassword,
          password: profileData.password
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        if (Array.isArray(result.detail)) {
          const msgs = result.detail.map((e: any) => `${e.loc[e.loc.length - 1]}: ${e.msg}`).join(", ");
          throw new Error(msgs);
        }
        throw new Error(result.detail || "Error al actualizar perfil");
      }
      
      setProfileMsg({ type: "success", text: "Datos actualizados correctamente." });
      setIsEditingProfile(false);
      setIsEditingAddress(false);
      setProfileData({...profileData, currentPassword: "", password: "", confirmPassword: ""});
      
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const loadOrders = async () => {
    if (orders.length > 0) return;
    if (!user) return;
    setLoadingOrders(true);
    try {
      const data = await fetchUserOrders(user.email);
      setOrders(data.orders);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (activeTab === "payments") {
      loadOrders();
    }
  }, [activeTab]);

  const handleDeleteAccount = () => {
    if (user && deleteConfirmEmail === user.email && deleteConfirmPassword.trim() !== "") {
      // Simulación de borrado de cuenta en el frontend
      alert("Cuenta eliminada exitosamente. Serás redirigido.");
      logout();
      navigate("/");
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 bg-white border border-slate-100 rounded-[32px] overflow-hidden min-h-[600px] shadow-sm">
      
      {/* Sidebar */}
      <div className="w-full md:w-64 bg-slate-50 border-r border-slate-100 p-6 flex flex-col gap-2">
        <h2 className="text-xl font-bold tracking-tight text-slate-800 mb-6 pl-2">Configuración</h2>
        
        <button 
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "profile" ? "bg-emerald-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-200/50"
          }`}
        >
          <IconUser /> Datos Personales
        </button>

        <button 
          onClick={() => setActiveTab("address")}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "address" ? "bg-emerald-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-200/50"
          }`}
        >
          <IconMap /> Dirección de Envío
        </button>

        <button 
          onClick={() => setActiveTab("payments")}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all cursor-pointer ${
            activeTab === "payments" ? "bg-emerald-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-200/50"
          }`}
        >
          <IconCard /> Historial de Pagos
        </button>

        <div className="mt-auto pt-6 border-t border-slate-200/60">
          <button 
            onClick={() => setActiveTab("danger")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${
              activeTab === "danger" ? "bg-rose-100 text-rose-700" : "text-rose-500 hover:bg-rose-50"
            }`}
          >
            <IconAlert /> Zona de Peligro
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-8 md:p-12">
        
        {/* TABS CONTENT */}
        
        {activeTab === "profile" && (
          <div className="animate-fade-in max-w-xl">
            <h3 className="text-2xl font-light text-slate-800 mb-8">Información <span className="font-semibold text-emerald-600">Personal</span></h3>
            
            {loadingProfile ? (
              <p className="text-slate-400 font-medium">Cargando datos...</p>
            ) : !isEditingProfile ? (
              <div className="space-y-6">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nombre Completo</h4>
                    <p className="text-slate-800 font-medium mt-1">{profileData.name}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Correo Electrónico</h4>
                    <p className="text-slate-800 font-medium mt-1">{profileData.email}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teléfono</h4>
                    <p className="text-slate-800 font-medium mt-1">{profileData.phone || <span className="text-slate-400 italic">No configurado</span>}</p>
                  </div>
                </div>

                {profileMsg.text && (
                  <div className={`p-4 rounded-xl text-sm font-semibold ${profileMsg.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>
                    {profileMsg.text}
                  </div>
                )}

                <button 
                  onClick={() => setIsEditingProfile(true)}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors cursor-pointer"
                >
                  Modificar Datos
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nombre Completo (No se puede modificar)</label>
                  <input 
                    type="text" disabled
                    value={profileData.name}
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Correo Electrónico (No se puede modificar)</label>
                  <input 
                    type="email" disabled
                    value={profileData.email}
                    className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 font-medium cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Teléfono</label>
                  <input 
                    type="text" 
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors text-slate-700 font-medium"
                    placeholder="Ej. +57 300 123 4567"
                  />
                </div>
                <div className="pt-6 mt-6 border-t border-slate-200">
                  <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Seguridad (Opcional)</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Contraseña Actual</label>
                      <input 
                        type="password" 
                        value={profileData.currentPassword}
                        onChange={(e) => setProfileData({...profileData, currentPassword: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors text-slate-700 font-medium"
                        placeholder="Ingresa tu contraseña actual"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nueva Contraseña</label>
                        <input 
                          type="password" 
                          value={profileData.password}
                          onChange={(e) => setProfileData({...profileData, password: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors text-slate-700 font-medium"
                          placeholder="Mínimo 6 caracteres"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Confirmar Nueva Contraseña</label>
                        <input 
                          type="password" 
                          value={profileData.confirmPassword}
                          onChange={(e) => setProfileData({...profileData, confirmPassword: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors text-slate-700 font-medium"
                          placeholder="Repite la contraseña"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 pt-2">
                  <button 
                    type="submit" disabled={savingProfile}
                    className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {savingProfile ? "Guardando..." : "Guardar Cambios"}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      setIsEditingProfile(false);
                      setProfileData({...profileData, currentPassword: "", password: "", confirmPassword: ""});
                    }}
                    disabled={savingProfile}
                    className="px-6 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === "address" && (
          <div className="animate-fade-in max-w-xl">
            <h3 className="text-2xl font-light text-slate-800 mb-8">Direcciones de <span className="font-semibold text-emerald-600">Envío</span></h3>
            
            {loadingProfile ? (
               <p className="text-slate-400 font-medium">Cargando direcciones...</p>
            ) : !isEditingAddress ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tus direcciones guardadas ({profileData.addresses.length}/3)</h4>
                  {profileData.addresses.map((addr, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex justify-between items-center gap-4">
                      <p className="text-slate-800 font-medium whitespace-pre-wrap">{addr}</p>
                      <button 
                        onClick={() => {
                          const newAddresses = profileData.addresses.filter((_, i) => i !== idx);
                          setProfileData({...profileData, addresses: newAddresses});
                        }}
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-2 rounded-xl transition-colors cursor-pointer shrink-0"
                        title="Eliminar dirección"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  ))}
                  {profileData.addresses.length === 0 && (
                    <p className="text-slate-400 italic">No has configurado una dirección de envío aún.</p>
                  )}
                </div>
                
                {profileMsg.text && (
                  <div className={`p-4 rounded-xl text-sm font-semibold ${profileMsg.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>
                    {profileMsg.text}
                  </div>
                )}

                <div className="flex gap-4 pt-2">
                  {profileData.addresses.length < 3 && (
                    <button 
                      onClick={() => setIsEditingAddress(true)}
                      className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Agregar Nueva
                    </button>
                  )}
                  <button 
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {savingProfile ? "Guardando..." : "Guardar Cambios"}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                const newAddress = (e.currentTarget.elements.namedItem("newAddress") as HTMLTextAreaElement).value.trim();
                if (newAddress && profileData.addresses.length < 3) {
                  setProfileData({...profileData, addresses: [...profileData.addresses, newAddress]});
                  setIsEditingAddress(false);
                }
              }} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Nueva dirección de entrega</label>
                  <textarea 
                    name="newAddress"
                    rows={4}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors text-slate-700 font-medium resize-none"
                    placeholder="Escribe aquí tu dirección completa..."
                  />
                </div>
                
                <div className="flex items-center gap-4">
                  <button 
                    type="submit"
                    className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Agregar a la lista
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={() => setIsEditingAddress(false)}
                    className="px-6 py-3 bg-white text-slate-600 border border-slate-200 rounded-xl font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {activeTab === "payments" && (
          <div className="animate-fade-in w-full">
            <h3 className="text-2xl font-light text-slate-800 mb-8">Historial de <span className="font-semibold text-emerald-600">Pagos</span></h3>
            
            {loadingOrders ? (
              <p className="text-slate-400 font-medium">Cargando historial...</p>
            ) : orders.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-3xl border border-slate-100">
                <p className="text-slate-500 font-medium">No hay pagos registrados.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-slate-100">
                      <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider px-2">ID Pedido</th>
                      <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Fecha</th>
                      <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Estado</th>
                      <th className="pb-4 text-xs font-bold text-slate-400 uppercase tracking-wider px-2 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.sk} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-2 text-sm font-bold text-slate-700">#{ (o.orderId || o.sk.replace("ORDER#", "")).slice(-8).toUpperCase() }</td>
                        <td className="py-4 px-2 text-sm text-slate-500 font-medium">
                          {new Date(o.createdAt).toLocaleDateString("es-CO", { year: 'numeric', month: 'short', day: 'numeric' })}
                        </td>
                        <td className="py-4 px-2">
                          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
                            {o.status}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-sm font-black text-slate-900 text-right">
                          ${o.total.toLocaleString("es-CO")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "danger" && (
          <div className="animate-fade-in max-w-xl">
            <h3 className="text-2xl font-light text-rose-600 mb-4">Zona de Peligro</h3>
            <p className="text-slate-600 font-medium mb-8">
              Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, asegúrate de que realmente quieres hacer esto.
            </p>

            <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
              <h4 className="text-rose-800 font-bold mb-2 text-sm uppercase tracking-wider">Eliminar Cuenta Permanentemente</h4>
              <p className="text-sm text-rose-700 mb-6">Para confirmar, escribe tu correo electrónico (<strong className="font-bold">{user?.email}</strong>) y tu contraseña:</p>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold text-rose-700 uppercase tracking-wider mb-2">Correo Electrónico</label>
                  <input 
                    type="email" 
                    value={deleteConfirmEmail}
                    onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-rose-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors text-slate-700 font-medium"
                    placeholder="tu@correo.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-rose-700 uppercase tracking-wider mb-2">Contraseña</label>
                  <input 
                    type="password" 
                    value={deleteConfirmPassword}
                    onChange={(e) => setDeleteConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-rose-200 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-colors text-slate-700 font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                onClick={handleDeleteAccount}
                disabled={!user || deleteConfirmEmail !== user.email || deleteConfirmPassword.trim() === ""}
                className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Eliminar Cuenta Ahora
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
