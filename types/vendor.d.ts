declare module "framer-motion" {
  import * as React from "react";

  export const AnimatePresence: React.ComponentType<
    React.PropsWithChildren<{ mode?: string }>
  >;

  export const motion: {
    [key: string]: React.ComponentType<any>;
  };
}

declare module "firebase/app" {
  export interface FirebaseApp {}

  export function initializeApp(config: Record<string, unknown>): FirebaseApp;
  export function getApp(): FirebaseApp;
  export function getApps(): FirebaseApp[];
}

declare module "firebase/auth" {
  import type { FirebaseApp } from "firebase/app";

  export interface IdTokenResult {
    claims: Record<string, unknown>;
  }

  export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    getIdToken(forceRefresh?: boolean): Promise<string>;
    getIdTokenResult(forceRefresh?: boolean): Promise<IdTokenResult>;
  }

  export interface UserCredential {
    user: User;
  }

  export interface Auth {}
  export interface AuthProvider {}

  export class GoogleAuthProvider implements AuthProvider {
    constructor();
    setCustomParameters(parameters: Record<string, string>): AuthProvider;
  }

  export function getAuth(app?: FirebaseApp): Auth;
  export function onIdTokenChanged(
    auth: Auth,
    callback: (user: User | null) => void | Promise<void>
  ): () => void;
  export function signInWithEmailAndPassword(
    auth: Auth,
    email: string,
    password: string
  ): Promise<UserCredential>;
  export function signInWithPopup(
    auth: Auth,
    provider: AuthProvider
  ): Promise<UserCredential>;
  export function createUserWithEmailAndPassword(
    auth: Auth,
    email: string,
    password: string
  ): Promise<UserCredential>;
  export function updateProfile(
    user: User,
    profile: { displayName?: string | null; photoURL?: string | null }
  ): Promise<void>;
  export function signOut(auth: Auth): Promise<void>;
  export function sendPasswordResetEmail(auth: Auth, email: string): Promise<void>;
}

declare module "firebase/firestore" {
  import type { FirebaseApp } from "firebase/app";

  export type DocumentData = Record<string, unknown>;

  export interface Firestore {}
  export interface DocumentReference<T = DocumentData> {
    id: string;
    path: string;
  }
  export interface CollectionReference<T = DocumentData> {}
  export interface Query<T = DocumentData> {}
  export interface DocumentSnapshot<T = DocumentData> {
    id: string;
    exists(): boolean;
    data(): T | undefined;
  }
  export interface QueryDocumentSnapshot<T = DocumentData>
    extends DocumentSnapshot<T> {
    ref: DocumentReference<T>;
    data(): T;
    get(field: string): unknown;
  }
  export interface QuerySnapshot<T = DocumentData> {
    docs: Array<QueryDocumentSnapshot<T>>;
  }
  export interface Transaction {
    get<T = DocumentData>(ref: DocumentReference<T>): Promise<DocumentSnapshot<T>>;
    set<T = DocumentData>(
      ref: DocumentReference<T>,
      data: Partial<T>,
      options?: { merge?: boolean }
    ): void;
    update<T = DocumentData>(ref: DocumentReference<T>, data: Partial<T>): void;
    delete<T = DocumentData>(ref: DocumentReference<T>): void;
  }
  export type Unsubscribe = () => void;

  export function getFirestore(app?: FirebaseApp): Firestore;
  export function doc(
    source: Firestore | CollectionReference<DocumentData> | DocumentReference<DocumentData>,
    ...pathSegments: string[]
  ): DocumentReference<DocumentData>;
  export function collection(
    source: Firestore | DocumentReference<DocumentData>,
    path: string
  ): CollectionReference<DocumentData>;
  export function query<T = DocumentData>(
    reference: CollectionReference<T>,
    ...queryConstraints: any[]
  ): Query<T>;
  export function where(fieldPath: string, opStr: string, value: unknown): any;
  export function orderBy(fieldPath: string, directionStr?: "asc" | "desc"): any;
  export function getDoc<T = DocumentData>(
    reference: DocumentReference<T>
  ): Promise<DocumentSnapshot<T>>;
  export function getDocs<T = DocumentData>(
    reference: Query<T> | CollectionReference<T>
  ): Promise<QuerySnapshot<T>>;
  export function setDoc<T = DocumentData>(
    reference: DocumentReference<T>,
    data: Partial<T>,
    options?: { merge?: boolean }
  ): Promise<void>;
  export function deleteDoc<T = DocumentData>(
    reference: DocumentReference<T>
  ): Promise<void>;
  export function onSnapshot<T = DocumentData>(
    reference: DocumentReference<T>,
    observer: (snapshot: DocumentSnapshot<T>) => void
  ): Unsubscribe;
  export function runTransaction<T>(
    db: Firestore,
    updateFunction: (transaction: Transaction) => Promise<T>
  ): Promise<T>;
  export function serverTimestamp(): unknown;
}

declare module "firebase/functions" {
  import type { FirebaseApp } from "firebase/app";

  export interface Functions {}

  export function getFunctions(app?: FirebaseApp, regionOrCustomDomain?: string): Functions;
  export function httpsCallable<TData = unknown, TResult = unknown>(
    functions: Functions,
    name: string
  ): (data: TData) => Promise<{ data: TResult }>;
}

declare module "firebase/storage" {
  import type { FirebaseApp } from "firebase/app";

  export interface FirebaseStorage {}
  export interface StorageReference {}
  export interface UploadResult {
    ref: StorageReference;
  }

  export function getStorage(app?: FirebaseApp): FirebaseStorage;
  export function ref(storage: FirebaseStorage, path: string): StorageReference;
  export function uploadBytes(
    reference: StorageReference,
    data: Blob | Uint8Array | ArrayBuffer
  ): Promise<UploadResult>;
  export function getDownloadURL(reference: StorageReference): Promise<string>;
}

declare module "qrcode" {
  const QRCode: {
    toDataURL(
      value: string,
      options?: {
        width?: number;
        margin?: number;
      }
    ): Promise<string>;
  };

  export default QRCode;
}
