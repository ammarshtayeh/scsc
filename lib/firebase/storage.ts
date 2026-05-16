"use client";

import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { storage } from "@/lib/firebase/firebase";

export async function uploadFileToStorage(path: string, file: File) {
  if (!storage) {
    throw new Error("Firebase Storage is not configured.");
  }

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function deleteFileFromStorage(pathOrUrl: string) {
  if (!storage || !pathOrUrl.trim()) {
    return false;
  }

  try {
    const normalizedPath = pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")
      ? decodeURIComponent(pathOrUrl.split("/o/")[1]?.split("?")[0] || "")
      : pathOrUrl;

    if (!normalizedPath) {
      return false;
    }

    await deleteObject(ref(storage, normalizedPath));
    return true;
  } catch {
    return false;
  }
}
