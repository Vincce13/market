"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/categories";
import { ALLOWED_TYPES, MAX_BYTES, MAX_MB, shrinkImage } from "@/lib/shrinkImage";

export default function SellPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function clearImage() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview("");
    if (fileRef.current) fileRef.current.value = "";
  }

  async function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const picked = input.files?.[0];
    if (!picked) return;

    if (!ALLOWED_TYPES.includes(picked.type)) {
      setError("Please choose a JPG, PNG, GIF, or WebP image.");
      input.value = "";
      return;
    }

    let f = picked;
    try {
      f = await shrinkImage(picked);
    } catch {
      // fall back to the original file
    }

    if (f.size > MAX_BYTES) {
      setError(`That image is too big. The limit is ${MAX_MB} MB.`);
      input.value = "";
      return;
    }

    setError("");
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setError("Please add a photo.");

    setBusy(true);
    setError("");

    // 1. upload the photo
    const ext = file.type.split("/")[1];
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("listing-images")
      .upload(path, file, { contentType: file.type });

    if (uploadError) {
      setBusy(false);
      return setError(uploadError.message);
    }
    const imageUrl = supabase.storage.from("listing-images").getPublicUrl(path).data.publicUrl;

    // 2. save the listing
    const { data, error } = await supabase
      .from("listings")
      .insert({
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        category,
        location: location.trim(),
        seller_email: email.trim(),
        image_url: imageUrl,
      })
      .select("id")
      .single();

    setBusy(false);
    if (error) return setError(error.message);

    router.push(`/listing/${data.id}`);
  }

  return (
    <div className="form-page">
      <form className="panel" onSubmit={submit}>
        <h1>Create new listing</h1>

        <label className="label">Photo</label>
        {preview ? (
          <div className="preview">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Selected upload preview" />
            <button type="button" className="remove-img" onClick={clearImage}>✕ Remove</button>
          </div>
        ) : (
          <label className="dropzone">
            📷 Add photo
            <input
              ref={fileRef}
              type="file"
              accept={ALLOWED_TYPES.join(",")}
              onChange={pickImage}
              hidden
            />
          </label>
        )}

        <label className="label">Title</label>
        <input className="field" value={title} onChange={(e) => setTitle(e.target.value)}
               minLength={3} maxLength={100} required />

        <div className="row">
          <div>
            <label className="label">Price</label>
            <input className="field" type="number" min="0" step="0.01" value={price}
                   onChange={(e) => setPrice(e.target.value)} required />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="field" value={category}
                    onChange={(e) => setCategory(e.target.value)} required>
              <option value="">Select...</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <label className="label">Location (optional)</label>
        <input className="field" value={location} maxLength={80}
               onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Cebu City" />

        <label className="label">Description</label>
        <textarea className="field" rows={5} value={description} maxLength={2000}
                  onChange={(e) => setDescription(e.target.value)} />

        <label className="label">Your email</label>
        <input className="field" type="email" value={email}
               onChange={(e) => setEmail(e.target.value)} required />
        <p className="hint">Buyers&apos; messages are sent here. It is also shown on your listing.</p>

        {error && <p className="error">{error}</p>}

        <button className="btn primary block" disabled={busy}>
          {busy ? "Publishing..." : "Publish listing"}
        </button>
      </form>
    </div>
  );
}