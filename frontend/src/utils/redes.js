import {
  Camera,
  Music,
  Music2,
  SquarePlay,
  Video,
  ThumbsUp,
  Globe as GlobeIcon,
} from "lucide-react";

export const PLATAFORMAS = [
  {
    id: "Instagram",
    icono: Camera,
    color: "text-pink-400",
    dominio: /(^|\.)instagram\.com$/i,
    placeholder: "https://www.instagram.com/tubanda",
  },
  {
    id: "Spotify",
    icono: Music,
    color: "text-green-400",
    dominio: /(^|\.)spotify\.com$/i,
    placeholder: "https://open.spotify.com/artist/...",
  },
  {
    id: "YouTube",
    icono: SquarePlay,
    color: "text-red-400",
    dominio: /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i,
    placeholder: "https://www.youtube.com/@tubanda",
  },
  {
    id: "TikTok",
    icono: Video,
    color: "text-slate-100",
    dominio: /(^|\.)tiktok\.com$/i,
    placeholder: "https://www.tiktok.com/@tubanda",
  },
  {
    id: "Facebook",
    icono: ThumbsUp,
    color: "text-blue-400",
    dominio: /(^|\.)facebook\.com$|(^|\.)fb\.com$/i,
    placeholder: "https://www.facebook.com/tubanda",
  },
  {
    id: "SoundCloud",
    icono: Music2,
    color: "text-orange-400",
    dominio: /(^|\.)soundcloud\.com$/i,
    placeholder: "https://soundcloud.com/tubanda",
  },
  {
    id: "Sitio web",
    icono: GlobeIcon,
    color: "text-brand-orange",
    dominio: /.+/,
    placeholder: "https://tubanda.com",
  },
];

export const obtenerPlataforma = (nombre) =>
  PLATAFORMAS.find((p) => p.id === nombre) ||
  PLATAFORMAS[PLATAFORMAS.length - 1];

export function validarUrlRed(plataformaId, url) {
  if (!url || !url.trim()) {
    return { valido: false, mensaje: "Ingresa una URL." };
  }
  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    return {
      valido: false,
      mensaje: "URL inválida. Debe comenzar con http:// o https://",
    };
  }
  if (!/^https?:$/.test(parsed.protocol)) {
    return { valido: false, mensaje: "Solo se aceptan URLs http o https." };
  }
  const plataforma = obtenerPlataforma(plataformaId);
  if (plataforma.id !== "Sitio web" && !plataforma.dominio.test(parsed.hostname)) {
    return {
      valido: false,
      mensaje: `La URL no parece ser de ${plataforma.id}.`,
    };
  }
  return { valido: true };
}
