"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

// -----------------------------------------------------
// (1) Define or import your database types if available
//     For demo, we'll define a simple "Profile" type.
// -----------------------------------------------------
type Profile = {
  id: number;
  name: string;
};

export default function TestAllPage() {
  // -----------------------------------------------------
  // (2) Configure your Supabase client (replace placeholders)
  // -----------------------------------------------------
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || "http://localhost:54321";
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "<YOUR_ANON_KEY>";

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // ------------------------
  // Auth State
  // ------------------------
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [authFeedback, setAuthFeedback] = useState<string>("");

  // ------------------------
  // Database State
  // ------------------------
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [newName, setNewName] = useState<string>("");
  const [dbFeedback, setDbFeedback] = useState<string>("");

  // ------------------------
  // Storage State
  // ------------------------
  const [fileName, setFileName] = useState<string>("");
  const [base64File, setBase64File] = useState<string>("");
  const [fileList, setFileList] = useState<{ name: string }[]>([]);
  const [storageFeedback, setStorageFeedback] = useState<string>("");

  // ------------------------------------------------------------------
  // 1) AUTH Functions
  // ------------------------------------------------------------------
  async function handleSignUp() {
    setAuthFeedback("");
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      setAuthFeedback(`✅ Signed Up! User ID: ${data.user?.id}`);
    } catch (err: unknown) {
      setAuthFeedback(`❌ Sign Up failed: ${(err as Error).message}`);
    }
  }

  async function handleSignIn() {
    setAuthFeedback("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      setAuthFeedback(`✅ Signed In! User ID: ${data.user?.id}`);
    } catch (err: unknown) {
      setAuthFeedback(`❌ Sign In failed: ${(err as Error).message}`);
    }
  }

  async function handleGetUser() {
    setAuthFeedback("");
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) {
        setAuthFeedback("No user is currently signed in.");
      } else {
        setAuthFeedback(`Current user ID: ${user.id}`);
      }
    } catch (err: unknown) {
      setAuthFeedback(`❌ Get user failed: ${(err as Error).message}`);
    }
  }

  async function handleSignOut() {
    setAuthFeedback("");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setAuthFeedback("✅ Signed out successfully.");
    } catch (err: unknown) {
      setAuthFeedback(`❌ Sign out failed: ${(err as Error).message}`);
    }
  }

  // ------------------------------------------------------------------
  // 2) DATABASE Functions
  // ------------------------------------------------------------------
  async function fetchProfiles() {
    setDbFeedback("");
    try {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      // Using a type assertion to treat the result as Profile[]
      setProfiles(data as Profile[]);
      setDbFeedback(`Fetched ${(data as Profile[]).length} profile(s).`);
    } catch (err: unknown) {
      setDbFeedback(`❌ Fetch profiles failed: ${(err as Error).message}`);
    }
  }

  async function addProfile() {
    setDbFeedback("");
    if (!newName.trim()) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .insert([{ name: newName }])
        .select();
      if (error) throw error;
      // data should be Profile[]
      setProfiles((prev) => [...prev, ...(data as Profile[])]);
      setNewName("");
      setDbFeedback(`✅ Profile added: ${(data as Profile[])[0]?.name}`);
    } catch (err: unknown) {
      setDbFeedback(`❌ Insert error: ${(err as Error).message}`);
    }
  }

  // ------------------------------------------------------------------
  // 3) STORAGE Functions
  // ------------------------------------------------------------------
  async function listFiles() {
    setStorageFeedback("");
    try {
      const { data, error } = await supabase.storage
        .from("test-bucket")
        .list("", {
          limit: 100,
          offset: 0,
          sortBy: { column: "name", order: "asc" },
        });
      if (error) throw error;
      // data should be an array of objects with a `name` prop
      setFileList((data as { name: string }[]) || []);
      setStorageFeedback(`Found ${data?.length || 0} file(s).`);
    } catch (err: unknown) {
      setStorageFeedback(`❌ List error: ${(err as Error).message}`);
    }
  }

  async function uploadFile() {
    setStorageFeedback("");
    if (!fileName || !base64File) {
      setStorageFeedback("❌ Please provide file name and base64 data.");
      return;
    }
    try {
      // Convert Base64 to Uint8Array (browser-friendly approach)
      const fileBuffer = Uint8Array.from(atob(base64File), (c) =>
        c.charCodeAt(0)
      );
      const { data, error } = await supabase.storage
        .from("test-bucket")
        .upload(fileName, fileBuffer, { upsert: true });
      if (error) throw error;
      setStorageFeedback(`✅ File uploaded: ${JSON.stringify(data)}`);
      listFiles(); // Refresh file list
    } catch (err: unknown) {
      setStorageFeedback(`❌ Upload error: ${(err as Error).message}`);
    }
  }

  // ------------------------------------------------------------------
  // Initialize (fetch DB + list files) on mount
  // ------------------------------------------------------------------
  useEffect(() => {
    fetchProfiles();
    listFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------------
  // Render Tailwind UI
  // ------------------------------------------------------------------
  return (
    <main className="max-w-3xl mx-auto p-8 space-y-8 text-black">
      <h1 className="text-3xl font-bold text-center mb-4 text-white">
        Supabase Test (App Router)
      </h1>

      {/* AUTH SECTION */}
      <section className="border border-gray-300 rounded p-4 shadow bg-white space-y-4">
        <h2 className="text-xl font-semibold">Auth Test</h2>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            placeholder="Email"
            className="border border-gray-300 rounded px-2 py-1 w-full sm:w-auto"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="border border-gray-300 rounded px-2 py-1 w-full sm:w-auto"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSignUp}
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
          >
            Sign Up
          </button>
          <button
            onClick={handleSignIn}
            className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
          >
            Sign In
          </button>
          <button
            onClick={handleGetUser}
            className="bg-gray-600 text-white px-4 py-1 rounded hover:bg-gray-700"
          >
            Get User
          </button>
          <button
            onClick={handleSignOut}
            className="bg-red-600 text-white px-4 py-1 rounded hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
        {authFeedback && (
          <div className="bg-gray-100 p-2 rounded text-sm whitespace-pre-wrap mt-2">
            {authFeedback}
          </div>
        )}
      </section>

      {/* DATABASE SECTION */}
      <section className="border border-gray-300 rounded p-4 shadow bg-white space-y-4">
        <h2 className="text-xl font-semibold">Database Test (profiles)</h2>
        <button
          onClick={fetchProfiles}
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
        >
          Refresh Profiles
        </button>
        {profiles.length > 0 ? (
          <ul className="list-disc list-inside mt-2 space-y-1">
            {profiles.map((p) => (
              <li key={p.id}>
                <strong>ID:</strong> {p.id}, <strong>Name:</strong> {p.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2">No profiles found.</p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row mt-2">
          <input
            type="text"
            placeholder="New profile name"
            className="border border-gray-300 rounded px-2 py-1 w-full sm:w-auto"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button
            onClick={addProfile}
            className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
          >
            Add Profile
          </button>
        </div>
        {dbFeedback && (
          <div className="bg-gray-100 p-2 rounded text-sm whitespace-pre-wrap">
            {dbFeedback}
          </div>
        )}
      </section>

      {/* STORAGE SECTION */}
      <section className="border border-gray-300 rounded p-4 shadow bg-white space-y-4">
        <h2 className="text-xl font-semibold">
          Storage Test (Bucket: test-bucket)
        </h2>
        <button
          onClick={listFiles}
          className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
        >
          List Files
        </button>
        {fileList.length > 0 ? (
          <ul className="list-disc list-inside mt-2 space-y-1">
            {fileList.map((file) => (
              <li key={file.name}>{file.name}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2">No files found.</p>
        )}
        <div className="flex flex-col gap-2 sm:flex-row items-start mt-2">
          <input
            type="text"
            placeholder="File name (e.g. test.txt)"
            className="border border-gray-300 rounded px-2 py-1 w-full sm:w-auto"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
          />
        </div>
        <textarea
          rows={3}
          placeholder="Base64 data here..."
          className="border border-gray-300 rounded p-2 w-full mt-2"
          value={base64File}
          onChange={(e) => setBase64File(e.target.value)}
        />
        <button
          onClick={uploadFile}
          className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700 mt-2"
        >
          Upload Base64 File
        </button>
        {storageFeedback && (
          <div className="bg-gray-100 p-2 rounded text-sm whitespace-pre-wrap">
            {storageFeedback}
          </div>
        )}
      </section>
    </main>
  );
}
