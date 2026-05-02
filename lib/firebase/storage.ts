"use client";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { storage } from "@/lib/firebase/firebase";

export async function uploadFileToStorage(path: string, file: File) {
  if (!storage) {
    throw new Error("Firebase Storage is not configured.");
  }

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}
