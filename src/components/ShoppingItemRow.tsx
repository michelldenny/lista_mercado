"use client";

import React, { useState, useEffect } from "react";
import { ShoppingItem } from "@/hooks/useShoppingLists";

interface ShoppingItemRowProps {
  item: ShoppingItem;
  handleToggleItem: (itemId: string) => void;
  handleUpdateField: (itemId: string, field: string, value: string) => void;
  handleRemoveItem: (itemId: string) => void;
}

export default function ShoppingItemRow({
  item,
  handleToggleItem,
  handleUpdateField,
  handleRemoveItem,
}: ShoppingItemRowProps) {
  // Local state for inputs to prevent cursor issues and focus jumps
  const [localFormat, setLocalFormat] = useState(item.format || "");
  const [localPrice, setLocalPrice] = useState(item.price !== undefined ? item.price.toString() : "0");
  const [localQuantity, setLocalQuantity] = useState(item.quantity !== undefined ? item.quantity.toString() : "1");

  // Keep local state in sync when item changes from DB (e.g. initial load or other users/devices)
  useEffect(() => {
    setLocalFormat(item.format || "");
  }, [item.format]);

  useEffect(() => {
    setLocalPrice(item.price !== undefined ? item.price.toString() : "0");
  }, [item.price]);

  useEffect(() => {
    setLocalQuantity(item.quantity !== undefined ? item.quantity.toString() : "1");
  }, [item.quantity]);

  // Handle saving to database
  const saveField = (field: string, value: string) => {
    handleUpdateField(item.id, field, value);
  };

  return (
    <div
      className={`item-card p-4 rounded-2xl border flex flex-col gap-3 ${
        item.checked ? "bg-slate-50 border-slate-200" : "bg-white border-slate-200 shadow-sm"
      }`}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleToggleItem(item.id)}
          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
            item.checked ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300"
          }`}
        >
          {item.checked && (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          )}
        </button>
        <div className="flex-1">
          <p className={`text-sm font-semibold text-slate-800 ${item.checked ? "line-through text-slate-400" : ""}`}>
            {item.name}
          </p>
          <input
            type="text"
            value={localFormat}
            onChange={(e) => setLocalFormat(e.target.value)}
            onBlur={() => saveField("format", localFormat)}
            placeholder="Formato (ex: 1kg, 500ml)"
            className="text-[10px] bg-transparent border-none p-0 outline-none text-slate-400 w-full font-bold uppercase placeholder:text-slate-200"
          />
        </div>
        <button onClick={() => handleRemoveItem(item.id)} className="text-slate-300 hover:text-red-400 p-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
      {item.checked && (
        <div className="flex items-center gap-4 pt-3 border-t border-slate-200/50">
          <div className="flex-1">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Preço Unit.</label>
            <input
              type="number"
              step="0.01"
              value={localPrice}
              onChange={(e) => setLocalPrice(e.target.value)}
              onBlur={() => saveField("price", localPrice)}
              className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-sm outline-none focus:border-emerald-400"
            />
          </div>
          <div className="w-20">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter text-center block">
              Qtd
            </label>
            <input
              type="number"
              value={localQuantity}
              onChange={(e) => setLocalQuantity(e.target.value)}
              onBlur={() => {
                // If user leaves it blank or invalid, reset to 1, otherwise save parsed int
                const parsed = parseInt(localQuantity);
                if (isNaN(parsed) || parsed < 1) {
                  setLocalQuantity("1");
                  saveField("quantity", "1");
                } else {
                  saveField("quantity", localQuantity);
                }
              }}
              className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-sm text-center outline-none focus:border-emerald-400"
            />
          </div>
          <div className="text-right min-w-[80px]">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Subtotal</label>
            <p className="text-sm font-black text-slate-800">
              R${" "}
              {((parseFloat(localPrice) || 0) * (parseInt(localQuantity) || 1)).toLocaleString("pt-PT", {
                minimumFractionDigits: 2,
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
