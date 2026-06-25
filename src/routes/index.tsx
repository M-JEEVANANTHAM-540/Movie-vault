import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Film, Plus, Trash2, Upload, X, Play, LogOut, LogIn, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Reelhouse — Your Personal Movie Library" },
      {
        name: "description",
        content: "Upload, browse, and manage your personal movie collection in one cinematic library.",
      },
      { property: "og:title", content: "Reelhouse — Your Personal Movie Library" },
      {
        property: "og:description",
        content: "Upload, browse, and manage your personal movie collection.",
      },
    ],
  }),
  component: Index,
});

type Movie = {
  id: string;
  title: string;
  description: string | null;
  year: number | null;
  poster_path: string | null;
  video_path: string | null;
  created_at: string;
};

function Index() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [playing, setPlaying] = useState<{ url: string; title: string } | null>(null);
  const [signedPosters, setSignedPosters] = useState<Record<string, string>>({});

  function requireAuth(action: () => void) {
    if (!user) {
      toast.error("Please sign in first");
      navigate({ to: "/auth" });
      return;
    }
    action();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
  }


  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("movies")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error("Failed to load movies");
    } else {
      setMovies((data ?? []) as Movie[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // Generate signed URLs for posters
  useEffect(() => {
    (async () => {
      const out: Record<string, string> = {};
      await Promise.all(
        movies.map(async (m) => {
          if (!m.poster_path) return;
          const { data } = await supabase.storage
            .from("movies")
            .createSignedUrl(m.poster_path, 60 * 60);
          if (data?.signedUrl) out[m.id] = data.signedUrl;
        }),
      );
      setSignedPosters(out);
    })();
  }, [movies]);

  async function handleDelete(movie: Movie) {
    if (!confirm(`Remove "${movie.title}" from your library?`)) return;
    const paths = [movie.poster_path, movie.video_path].filter(Boolean) as string[];
    if (paths.length) {
      await supabase.storage.from("movies").remove(paths);
    }
    const { error } = await supabase.from("movies").delete().eq("id", movie.id);
    if (error) {
      toast.error("Failed to remove movie");
    } else {
      toast.success(`Removed "${movie.title}"`);
      setMovies((prev) => prev.filter((m) => m.id !== movie.id));
    }
  }

  async function handlePlay(movie: Movie) {
    if (!movie.video_path) {
      toast.error("No video file for this movie");
      return;
    }
    const { data, error } = await supabase.storage
      .from("movies")
      .createSignedUrl(movie.video_path, 60 * 60);
    if (error || !data?.signedUrl) {
      toast.error("Could not load video");
      return;
    }
    setPlaying({ url: data.signedUrl, title: movie.title });
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <Toaster theme="dark" position="top-center" />

      {/* Header */}
      <header className="border-b border-border/60 backdrop-blur-md bg-background/50 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="size-10 rounded-lg flex items-center justify-center"
              style={{ background: "var(--primary)", boxShadow: "var(--shadow-glow)" }}
            >
              <Film className="size-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Reelhouse</h1>
              <p className="text-xs text-muted-foreground -mt-0.5">Your personal cinema</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs">
                  <UserIcon className="size-3.5" />
                  <span className="max-w-[140px] truncate">{user.email}</span>
                </div>
                <button
                  onClick={() => requireAuth(() => setUploadOpen(true))}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
                  style={{ boxShadow: "var(--shadow-glow)" }}
                >
                  <Plus className="size-4" /> Upload
                </button>
                <button
                  onClick={handleSignOut}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted"
                  title="Sign out"
                >
                  <LogOut className="size-4" />
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition"
                style={{ boxShadow: "var(--shadow-glow)" }}
              >
                <LogIn className="size-4" /> Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-12 text-center">
        <h2 className="text-5xl md:text-6xl font-bold tracking-tight">
          Your library.{" "}
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: "linear-gradient(135deg, var(--primary), var(--accent))" }}>
            Your cinema.
          </span>
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
          Upload films, build your collection, and stream them back anytime.
        </p>
      </section>

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-6 pb-24">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">
            {loading ? "Loading…" : `${movies.length} ${movies.length === 1 ? "Movie" : "Movies"}`}
          </h3>
        </div>

        {!loading && movies.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl p-16 text-center">
            <Film className="size-12 mx-auto text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">Your library is empty</p>
            <p className="text-sm text-muted-foreground">Upload your first movie to get started.</p>
            <button
              onClick={() => requireAuth(() => setUploadOpen(true))}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <Plus className="size-4" /> {user ? "Upload Movie" : "Sign in to upload"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {movies.map((m) => (
              <article
                key={m.id}
                className="group relative rounded-xl overflow-hidden bg-card border border-border hover:border-primary/50 transition"
                style={{ boxShadow: "var(--shadow-poster)" }}
              >
                <button
                  type="button"
                  onClick={() => m.video_path && handlePlay(m)}
                  disabled={!m.video_path}
                  className="block w-full text-left aspect-[2/3] relative bg-muted overflow-hidden disabled:cursor-not-allowed"
                  aria-label={m.video_path ? `Play ${m.title}` : `${m.title} — no video available`}
                >
                  {signedPosters[m.id] ? (
                    <img
                      src={signedPosters[m.id]}
                      alt={m.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="size-10 text-muted-foreground" />
                    </div>
                  )}

                  {/* Always-visible play badge for clarity on touch devices */}
                  {m.video_path && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition">
                      <div
                        className="size-14 rounded-full bg-primary flex items-center justify-center"
                        style={{ boxShadow: "var(--shadow-glow)" }}
                      >
                        <Play className="size-6 text-primary-foreground fill-current ml-0.5" />
                      </div>
                    </div>
                  )}
                  {m.video_path && (
                    <div className="absolute top-2 right-2 size-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center sm:opacity-0 group-hover:opacity-0 transition">
                      <Play className="size-4 text-white fill-current ml-0.5" />
                    </div>
                  )}
                </button>

                {user && (
                  <button
                    onClick={() => handleDelete(m)}
                    className="absolute top-2 left-2 size-8 rounded-full bg-destructive/90 hover:bg-destructive flex items-center justify-center text-destructive-foreground transition z-10"
                    aria-label={`Remove ${m.title}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}

                <div className="p-3">
                  <h4 className="font-semibold text-sm truncate">{m.title}</h4>
                  <p className="text-xs text-muted-foreground">{m.year ?? "—"}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {uploadOpen && <UploadDialog onClose={() => setUploadOpen(false)} onUploaded={load} />}
      {playing && <PlayerDialog url={playing.url} title={playing.title} onClose={() => setPlaying(null)} />}
    </div>
  );
}

function UploadDialog({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const [title, setTitle] = useState("");
  const [year, setYear] = useState("");
  const [description, setDescription] = useState("");
  const [poster, setPoster] = useState<File | null>(null);
  const [video, setVideo] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<string>("");

  const posterPreview = useMemo(() => (poster ? URL.createObjectURL(poster) : null), [poster]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSubmitting(true);
    try {
      let posterPath: string | null = null;
      let videoPath: string | null = null;

      if (poster) {
        setProgress("Uploading poster…");
        const ext = poster.name.split(".").pop() ?? "jpg";
        const path = `posters/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("movies").upload(path, poster);
        if (error) throw error;
        posterPath = path;
      }
      if (video) {
        setProgress("Uploading video…");
        const ext = video.name.split(".").pop() ?? "mp4";
        const path = `videos/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("movies").upload(path, video);
        if (error) throw error;
        videoPath = path;
      }

      setProgress("Saving…");
      const { error } = await supabase.from("movies").insert({
        title: title.trim(),
        description: description.trim() || null,
        year: year ? Number(year) : null,
        poster_path: posterPath,
        video_path: videoPath,
      });
      if (error) throw error;

      toast.success("Movie added to your library");
      onUploaded();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setSubmitting(false);
      setProgress("");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold">Upload a movie</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Blade Runner"
              className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              required
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="text-sm font-medium">Year</label>
              <input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
                type="number"
                className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
                className="mt-1 w-full rounded-lg bg-input border border-border px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FileField
              label="Poster image"
              accept="image/*"
              file={poster}
              onChange={setPoster}
              preview={posterPreview}
            />
            <FileField
              label="Video file"
              accept="video/*"
              file={video}
              onChange={setVideo}
            />
          </div>

          {progress && <p className="text-xs text-muted-foreground">{progress}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              <Upload className="size-4" />
              {submitting ? "Uploading…" : "Add to library"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FileField({
  label,
  accept,
  file,
  onChange,
  preview,
}: {
  label: string;
  accept: string;
  file: File | null;
  onChange: (f: File | null) => void;
  preview?: string | null;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="text-sm font-medium">{label}</label>
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="mt-1 w-full aspect-video rounded-lg border-2 border-dashed border-border bg-input hover:border-primary/60 transition flex items-center justify-center text-xs text-muted-foreground overflow-hidden relative"
      >
        {preview ? (
          <img src={preview} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : file ? (
          <span className="px-2 text-center truncate">{file.name}</span>
        ) : (
          <span className="flex flex-col items-center gap-1">
            <Upload className="size-4" />
            Choose file
          </span>
        )}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

function PlayerDialog({ url, title, onClose }: { url: string; title: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90" onClick={onClose}>
      <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-6" />
          </button>
        </div>
        <video src={url} controls autoPlay className="w-full rounded-xl bg-black aspect-video" />
      </div>
    </div>
  );
}
