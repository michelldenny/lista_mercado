"use client";

import { useState, useEffect } from "react";
import { signInAnonymously, onAuthStateChanged, User } from "firebase/auth";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { auth, db, APP_ID } from "@/lib/firebase";

export type ShoppingItem = {
  id: string;
  name: string;
  price?: number;
  quantity?: number;
  format?: string;
  checked: boolean;
};

export type ShoppingList = {
  id: string;
  name: string;
  items: ShoppingItem[];
  isMother: boolean;
  createdAt: number;
};

export function useShoppingLists() {
  const [user, setUser] = useState<User | null>(null);
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    signInAnonymously(auth).catch((error) => {
      console.error("Firebase auth error:", error);
      setAuthError(true);
    });

    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        setAuthError(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;

    const listsCollection = collection(db, "artifacts", APP_ID, "public", "data", "shoppingLists");
    const unsubscribe = onSnapshot(listsCollection, (snapshot) => {
      const fetchedLists = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as ShoppingList));
      setLists(fetchedLists);
      
      if (fetchedLists.length === 0) {
        createNewList("Minha Primeira Lista", true);
      } else {
        setCurrentListId((prev) => {
          if (!prev || !fetchedLists.find(l => l.id === prev)) {
            return fetchedLists[0].id;
          }
          return prev;
        });
      }
      setLoading(false);
    }, (err) => {
      console.error("Snapshot error:", err);
    });

    return () => unsubscribe();
  }, [user]);

  const createNewList = async (name: string, isMother = false) => {
    if (!user) return;
    const listsCollection = collection(db, "artifacts", APP_ID, "public", "data", "shoppingLists");
    const newDocRef = await addDoc(listsCollection, {
      name,
      items: [],
      isMother,
      createdAt: Date.now()
    });
    setCurrentListId(newDocRef.id);
  };

  const currentList = lists.find((l) => l.id === currentListId);

  const updateCurrentListItems = async (newItems: ShoppingItem[]) => {
    if (!user || !currentListId) return;
    const listDoc = doc(db, "artifacts", APP_ID, "public", "data", "shoppingLists", currentListId);
    await updateDoc(listDoc, { items: newItems });
  };

  const setAsMother = async (id: string) => {
    if (!user) return;
    for (const l of lists) {
      const listDoc = doc(db, "artifacts", APP_ID, "public", "data", "shoppingLists", l.id);
      await updateDoc(listDoc, { isMother: l.id === id });
    }
  };

  const deleteList = async (id: string) => {
    if (lists.length <= 1) {
      alert("Precisa de pelo menos uma lista.");
      return;
    }
    if (confirm("Eliminar esta lista permanentemente?")) {
      const listDoc = doc(db, "artifacts", APP_ID, "public", "data", "shoppingLists", id);
      await deleteDoc(listDoc);
      if (currentListId === id) {
        setCurrentListId(lists.find((l) => l.id !== id)?.id || null);
      }
    }
  };

  const renameList = async (id: string, newName: string) => {
    if (!user || !id || !newName) return;
    const listDoc = doc(db, "artifacts", APP_ID, "public", "data", "shoppingLists", id);
    await updateDoc(listDoc, { name: newName });
  };

  return {
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
  };
}
