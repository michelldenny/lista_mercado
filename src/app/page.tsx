"use client";

import { useState } from "react";
import { useShoppingLists } from "@/hooks/useShoppingLists";
import ChatModal from "@/components/ChatModal";
import ShoppingItemRow from "@/components/ShoppingItemRow";

export default function Home() {
  const {
    user,
    lists,
    currentListId,
    setCurrentListId,
    currentList,
    loading,
    authError,
    createNewList,
    updateCurrentListItems,
    setAsMother,
    deleteList,
    renameList,
  } = useShoppingLists();

  const [currentTab, setCurrentTab] = useState<"list" | "table">("list");
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isMotherOpen, setIsMotherOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [listToRenameId, setListToRenameId] = useState<string | null>(null);
  const [renameInput, setRenameInput] = useState("");
  const [newListInput, setNewListInput] = useState("");
  const [itemInput, setItemInput] = useState("");
  const [motherSearch, setMotherSearch] = useState("");
  
  const [importSelection, setImportSelection] = useState<Set<string>>(new Set());

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Backup handlers
  const handleDownloadJSON = () => {
    try {
      const dataStr = JSON.stringify(lists, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `backup_shopping_lists_${new Date().toISOString().split('T')[0]}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      showToast("Backup JSON iniciado!");
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar JSON de backup.");
    }
  };

  const handleDownloadCSV = () => {
    try {
      // Headers
      let csvContent = "Lista,Item,Formato,Preco,Quantidade,Comprado,ListaMae\n";
      
      lists.forEach(list => {
        const isMotherStr = list.isMother ? "Sim" : "Nao";
        if (list.items && list.items.length > 0) {
          list.items.forEach(item => {
            const name = item.name.replace(/"/g, '""');
            const format = (item.format || "").replace(/"/g, '""');
            const price = item.price || 0;
            const quantity = item.quantity || 1;
            const checked = item.checked ? "Sim" : "Nao";
            csvContent += `"${list.name}","${name}","${format}",${price},${quantity},"${checked}","${isMotherStr}"\n`;
          });
        } else {
          csvContent += `"${list.name}","","","","","","${isMotherStr}"\n`;
        }
      });

      const dataUri = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvContent);
      const exportFileDefaultName = `backup_shopping_lists_${new Date().toISOString().split('T')[0]}.csv`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      showToast("Backup CSV iniciado!");
    } catch (error) {
      console.error(error);
      alert("Erro ao gerar CSV de backup.");
    }
  };

  if (loading && !authError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400 font-bold animate-pulse">Carregando...</p>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="fixed inset-0 z-[200] bg-white flex items-center justify-center p-6 text-center">
        <div className="max-w-sm">
          <div className="bg-red-50 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-4">Ação Necessária</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">O recurso de <b>Login Anónimo</b> não está ativo no seu console Firebase. Ative-o para usar o app.</p>
        </div>
      </div>
    );
  }

  const items = currentList?.items || [];
  const sortedItems = [...items].sort((a, b) => {
    if (a.checked !== b.checked) return a.checked ? 1 : -1;
    return a.name.localeCompare(b.name, 'pt-PT');
  });
  
  const grandTotal = items.reduce((acc, i) => i.checked ? acc + ((i.price || 0) * (i.quantity || 1)) : acc, 0);

  // Actions
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = itemInput.trim();
    if (name && currentList) {
      if (currentList.items.some(i => i.name.toLowerCase() === name.toLowerCase())) {
        showToast(`"${name}" já está nesta lista!`);
        setItemInput("");
        return;
      }
      const newItems = [...currentList.items, { id: Date.now().toString() + Math.random(), name, price: 0, quantity: 1, format: "", checked: false }];
      setItemInput("");
      await updateCurrentListItems(newItems);
    }
  };

  const handleToggleItem = async (itemId: string) => {
    if (!currentList) return;
    const newItems = currentList.items.map(i => i.id === itemId ? { ...i, checked: !i.checked } : i);
    await updateCurrentListItems(newItems);
  };

  const handleUpdateField = async (itemId: string, field: string, value: string) => {
    if (!currentList) return;
    const newItems = currentList.items.map(i => {
      if (i.id === itemId) {
        const updated = { ...i, [field]: field === 'price' ? parseFloat(value) || 0 : field === 'quantity' ? parseInt(value) || 1 : value };
        return updated;
      }
      return i;
    });
    await updateCurrentListItems(newItems);
  };

  const handleRemoveItem = async (itemId: string) => {
    if (!currentList) return;
    const newItems = currentList.items.filter(i => i.id !== itemId);
    await updateCurrentListItems(newItems);
  };

  const motherList = lists.find(l => l.isMother);

  const handleImportToggle = (itemId: string, checked: boolean) => {
    const newSet = new Set(importSelection);
    if (checked) newSet.add(itemId);
    else newSet.delete(itemId);
    setImportSelection(newSet);
  };

  const confirmImport = async () => {
    if (!currentList || !motherList) return;
    const newItems = [...currentList.items];
    let count = 0;
    Array.from(importSelection).forEach(itemId => {
      const item = motherList.items.find(i => i.id === itemId);
      if (item && !newItems.some(i => i.name.toLowerCase() === item.name.toLowerCase())) {
        newItems.push({ ...item, id: Date.now().toString() + Math.random(), checked: false, price: 0, quantity: 1 });
        count++;
      }
    });
    if (count > 0) {
      await updateCurrentListItems(newItems);
    } else {
      showToast("Nenhum item novo foi importado.");
    }
    setIsMotherOpen(false);
  };

  return (
    <>
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl shadow-2xl font-bold text-sm transition-all duration-300 animate-slide-in bg-red-600 text-white">
          {toastMessage}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6 transition-opacity duration-500">
        <header className="flex justify-between items-center mb-6">
          <div className="flex-1 overflow-hidden pr-4">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">SmartList Pro</h1>
            <p className="text-emerald-600 font-bold text-sm italic truncate">
              {currentList ? `${currentList.name} ${currentList.isMother ? '(Lista Mãe)' : ''}` : 'Conectado...'}
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsChatOpen(true)} className="bg-emerald-50 border border-emerald-200 text-emerald-600 p-3 rounded-2xl shadow-sm hover:bg-emerald-100 transition-all hover:scale-105 active:scale-95 shrink-0 flex items-center gap-2">
              <span className="text-xl">✨</span> <span className="font-bold text-sm hidden sm:block">IA</span>
            </button>
            <button onClick={() => setIsManagerOpen(true)} className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm hover:bg-slate-50 transition-all hover:scale-105 active:scale-95 shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-700"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
          </div>
        </header>

        <div className="flex border-b border-slate-200 mb-8 sticky top-0 bg-slate-50/90 backdrop-blur-md z-40">
          <button onClick={() => setCurrentTab('list')} className={`flex-1 py-4 text-sm font-black transition-all uppercase tracking-widest ${currentTab === 'list' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-slate-400'}`}>Lista</button>
          <button onClick={() => setCurrentTab('table')} className={`flex-1 py-4 text-sm font-black transition-all uppercase tracking-widest ${currentTab === 'table' ? 'text-emerald-500 border-b-2 border-emerald-500' : 'text-slate-400'}`}>Planilha</button>
        </div>

        {currentTab === 'list' && (
          <div>
            <div className="flex gap-2 mb-8">
              <div className="flex-1 bg-white rounded-[1.5rem] shadow-sm border border-slate-200 p-2">
                <form onSubmit={handleAddItem} className="flex gap-2">
                  <input type="text" value={itemInput} onChange={(e) => setItemInput(e.target.value)} placeholder="Adicionar novo item..." className="flex-1 border-none focus:ring-0 px-4 py-2.5 text-slate-700 font-medium outline-none bg-transparent placeholder:text-slate-300" />
                  <button type="submit" className="bg-emerald-500 text-white p-3 rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100 active:scale-90">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                </form>
              </div>
              <button onClick={() => {
                if (!motherList) return alert("Defina uma lista como Mãe (⭐) primeiro.");
                if (motherList.id === currentListId) return alert("Já está a visualizar a Lista Mãe.");
                setImportSelection(new Set());
                setMotherSearch("");
                setIsMotherOpen(true);
              }} title="Importar da Lista Mãe" className="bg-white border border-slate-200 p-4 rounded-[1.5rem] shadow-sm text-slate-600 hover:bg-slate-50 transition-colors active:scale-90">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              </button>
            </div>
            
            <div className="space-y-4">
              {sortedItems.map(item => (
                <ShoppingItemRow
                  key={item.id}
                  item={item}
                  handleToggleItem={handleToggleItem}
                  handleUpdateField={handleUpdateField}
                  handleRemoveItem={handleRemoveItem}
                />
              ))}
            </div>
          </div>
        )}


        {currentTab === 'table' && (
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[10px] text-slate-400 uppercase font-black tracking-widest">
                    <th className="px-6 py-5">Produto</th>
                    <th className="px-6 py-5">Emb.</th>
                    <th className="px-6 py-5 text-right">Preço</th>
                    <th className="px-6 py-5 text-center">Qtd</th>
                    <th className="px-6 py-5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedItems.map(item => (
                    <tr key={item.id} className={`transition-colors ${item.checked ? 'bg-emerald-50/20' : ''}`}>
                      <td className={`px-4 py-4 text-sm font-medium ${item.checked ? 'text-slate-400 italic' : 'text-slate-800'}`}>{item.name}</td>
                      <td className="px-4 py-4 text-[10px] text-slate-400 font-bold uppercase">{item.format || '-'}</td>
                      <td className="px-4 py-4 text-sm text-right text-slate-600 font-mono">R$ {(item.price || 0).toFixed(2)}</td>
                      <td className="px-4 py-4 text-sm text-center text-slate-600">{item.quantity || 1}</td>
                      <td className="px-4 py-4 text-sm font-bold text-right text-slate-900 font-mono">R$ {((item.price || 0) * (item.quantity || 1)).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-6 shadow-[0_-15px_40px_-10px_rgba(0,0,0,0.1)] z-50">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-[0.25em] mb-1">Total no Carrinho</p>
            <p className="text-4xl font-black text-slate-800 tabular-nums">R$ {grandTotal.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
          </div>
          <button onClick={() => { if (confirm("Esvaziar esta lista inteira?")) updateCurrentListItems([]) }} className="text-xs font-black text-red-400 px-6 py-4 hover:bg-red-50 rounded-[1.2rem] transition-colors border-2 border-transparent hover:border-red-100 uppercase tracking-widest">Esvaziar</button>
        </div>
      </div>

      {isManagerOpen && (
        <div className="fixed inset-0 z-[60] modal-overlay flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsManagerOpen(false); }}>
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl animate-slide-in">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black text-slate-800">As Suas Listas</h2>
              <button onClick={() => setIsManagerOpen(false)} className="text-slate-300 text-4xl leading-none hover:text-slate-500 transition-colors">&times;</button>
            </div>
            <div className="space-y-4 mb-8 max-h-[50vh] overflow-y-auto pr-2 no-scrollbar">
              {lists.map(l => (
                <div key={l.id} className={`flex items-center gap-2 p-3 rounded-2xl border transition-all ${l.id === currentListId ? 'border-emerald-500 bg-emerald-50 shadow-inner' : 'border-slate-100 bg-white'}`}>
                  <div className="flex-1 cursor-pointer overflow-hidden" onClick={() => { setCurrentListId(l.id); setIsManagerOpen(false); }}>
                    <p className="font-bold text-slate-800 truncate">{l.name} {l.isMother ? '⭐' : ''}</p>
                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tight">{(l.items?.length || 0)} itens registados</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => { setListToRenameId(l.id); setRenameInput(l.name); setIsRenameOpen(true); }} className="p-2 rounded-xl text-slate-300 hover:text-emerald-500 hover:bg-emerald-50 transition-all">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button onClick={() => setAsMother(l.id)} className={`p-2 rounded-xl ${l.isMother ? 'text-amber-500 bg-amber-50' : 'text-slate-300 hover:bg-slate-50'} transition-all`}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill={l.isMother ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                    </button>
                    <button onClick={() => deleteList(l.id)} className="p-2 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={async (e) => { e.preventDefault(); if (newListInput) { await createNewList(newListInput); setNewListInput(""); } }} className="flex gap-3 pt-8 border-t border-slate-100">
              <input type="text" value={newListInput} onChange={(e) => setNewListInput(e.target.value)} placeholder="Nome da lista..." className="flex-1 bg-slate-50 rounded-[1.5rem] px-5 py-4 outline-none border border-transparent focus:border-emerald-500 transition-all font-medium text-sm" />
              <button type="submit" className="bg-emerald-500 text-white px-6 py-4 rounded-[1.5rem] font-black shadow-xl shadow-emerald-100 uppercase text-xs tracking-widest">CRIAR</button>
            </form>
            
            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-3">Backup de Dados</p>
              <div className="flex gap-3">
                <button 
                  onClick={handleDownloadJSON}
                  className="flex-1 py-3 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  📥 JSON
                </button>
                <button 
                  onClick={handleDownloadCSV}
                  className="flex-1 py-3 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  📥 CSV
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isRenameOpen && (
        <div className="fixed inset-0 z-[70] modal-overlay flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsRenameOpen(false); }}>
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-slide-in">
            <h2 className="text-xl font-black text-slate-800 mb-6">Renomear Lista</h2>
            <form onSubmit={async (e) => { e.preventDefault(); if (renameInput && listToRenameId) { await renameList(listToRenameId, renameInput); setIsRenameOpen(false); } }}>
              <input type="text" value={renameInput} onChange={(e) => setRenameInput(e.target.value)} placeholder="Novo nome..." className="w-full bg-slate-50 rounded-2xl px-5 py-4 mb-8 outline-none border border-transparent focus:border-emerald-500 transition-all font-medium" />
              <div className="flex gap-3">
                <button type="button" onClick={() => setIsRenameOpen(false)} className="flex-1 py-4 rounded-2xl bg-slate-100 font-bold text-slate-500 hover:bg-slate-200 transition-colors">CANCELAR</button>
                <button type="submit" className="flex-1 py-4 rounded-2xl bg-emerald-500 font-bold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-colors">GUARDAR</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isMotherOpen && motherList && (
        <div className="fixed inset-0 z-[60] modal-overlay flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) setIsMotherOpen(false); }}>
          <div className="bg-white w-full max-w-md rounded-[3rem] p-8 shadow-2xl animate-slide-in">
            <h2 className="text-2xl font-black text-slate-800 mb-2">Importar Itens</h2>
            <p className="text-slate-400 font-medium text-sm mb-4 italic">Selecione referências da sua Lista Mãe:</p>
            
            <input 
              type="text" 
              value={motherSearch} 
              onChange={(e) => setMotherSearch(e.target.value)} 
              placeholder="Buscar itens..." 
              className="w-full bg-slate-50 rounded-2xl px-5 py-4 mb-4 outline-none border border-transparent focus:border-emerald-500 transition-all font-medium text-sm" 
            />

            <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1 no-scrollbar mb-10">
              {[...motherList.items].filter(item => {
                if (!item || !item.name) return false;
                const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
                return normalize(item.name).includes(normalize(motherSearch || ""));
              })
              .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
              .map(item => {
                const alreadyHas = currentList?.items.some(i => i.name.toLowerCase() === item.name.toLowerCase());
                return (
                  <div key={item.id} className={`flex items-center justify-between p-4 rounded-2xl border ${alreadyHas ? 'bg-slate-50 opacity-40' : 'bg-white border-slate-100 hover:border-emerald-200'}`}>
                    <span className="text-sm font-semibold">{item.name} <small className="text-slate-400 font-bold ml-1">{item.format || ''}</small></span>
                    {alreadyHas ? <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">No Carrinho</span> : 
                    <input type="checkbox" checked={importSelection.has(item.id)} onChange={(e) => handleImportToggle(item.id, e.target.checked)} className="w-6 h-6 accent-emerald-500 rounded-lg cursor-pointer" />}
                  </div>
                );
              })}
            </div>
            <div className="flex gap-4">
              <button onClick={() => setIsMotherOpen(false)} className="flex-1 py-4 rounded-[1.5rem] bg-slate-100 font-black text-slate-500 hover:bg-slate-200 transition-colors">VOLTAR</button>
              <button onClick={confirmImport} className="flex-1 py-4 rounded-[1.5rem] bg-emerald-500 font-black text-white shadow-xl shadow-emerald-200 hover:bg-emerald-600 transition-colors">ADICIONAR</button>
            </div>
          </div>
        </div>
      )}

      <ChatModal isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} allLists={lists} currentListId={currentListId} />
    </>
  );
}
