// Place description via **Groq** + ONE Unsplash image (with credit and exact photo location when available).
// Requires: GROQ_API_KEY and UNSPLASH_ACCESS_KEY in server/.env

import { ENV } from "../config/env.js";
import Groq from "groq-sdk";

type Coord = { lat: number; lng: number };

const groq = new Groq({ apiKey: ENV.GROQ_API_KEY });

async function fetchJSON(url: string, headers?: Record<string, string>) {
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(String(r.status));
    return r.json();
}

/* ---------------- Groq: concise travel description of the place ---------------- */

async function groqPlaceDescription(location: string): Promise<string> {
    if (!ENV.GROQ_API_KEY) return "";
    const system =
        "You are a precise travel writer. Write a concise, factual overview of the given place for travelers. " +
        "Length: about 90–130 words. Mention 3–6 notable highlights (neighborhoods, landmarks, nature, food, or culture), " +
        "brief orientation (where it is), and a quick seasonal/weather note. No marketing fluff, no emojis, no links. " +
        "Return clean HTML using one or two <p> paragraphs only.";
    const user = `Place: ${location}\nWrite the overview now.`;

    try {
        const resp = await groq.chat.completions.create({
            model: "llama3-70b-8192",
            temperature: 0.7,
            max_tokens: 300,
            messages: [
                { role: "system", content: system },
                { role: "user", content: user }
            ]
        });
        const content = resp.choices?.[0]?.message?.content?.trim() || "";
        // Ensure we return minimal safe HTML if the model returned plain text
        if (!content.includes("<p>")) {
            return `<p>${content.replace(/\n{2,}/g, "</p><p>").replace(/\n/g, " ")}</p>`;
        }
        return content;
    } catch {
        return "";
    }
}

/* ---------------- Unsplash: one image with credit + exact location if available ---------------- */

type UnsplashMedia = {
    url: string;
    credit: string;            // "Photographer / Unsplash"
    description?: string;      // optional, we do NOT show as place description
    locationName?: string;     // human-readable place
    locationLat?: number;
    locationLng?: number;
};

async function unsplashOneWithDetails(query: string): Promise<UnsplashMedia | null> {
    if (!ENV.UNSPLASH_ACCESS_KEY) return null;

    // 1) Search one landscape image for the place
    const searchUrl =
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}` +
        `&orientation=landscape&per_page=1&content_filter=high`;
    const s = await fetch(searchUrl, {
        headers: { Authorization: `Client-ID ${ENV.UNSPLASH_ACCESS_KEY}` },
    });
    if (!s.ok) return null;
    const sj = await s.json();
    const hit = sj?.results?.[0];
    if (!hit) return null;

    const photoId: string | undefined = hit.id;
    const url = hit.urls?.regular || hit.urls?.small || hit.urls?.full || "";
    const creditUser = hit.user?.name || "Unsplash Creator";
    const credit = `${creditUser} / Unsplash`;

    // 2) Enrich with exact location when available
    let locationName: string | undefined;
    let locationLat: number | undefined;
    let locationLng: number | undefined;

    if (photoId) {
        const detailUrl = `https://api.unsplash.com/photos/${photoId}`;
        const d = await fetch(detailUrl, {
            headers: { Authorization: `Client-ID ${ENV.UNSPLASH_ACCESS_KEY}` },
        });
        if (d.ok) {
            const dj = await d.json();
            const loc = dj?.location || {};
            const pos = loc?.position || {};
            locationName = loc?.name || [loc?.city, loc?.country].filter(Boolean).join(", ") || undefined;
            locationLat = typeof pos?.latitude === "number" ? pos.latitude : undefined;
            locationLng = typeof pos?.longitude === "number" ? pos.longitude : undefined;
        }
    }

    return url
        ? { url, credit, description: hit.description || hit.alt_description || undefined, locationName, locationLat, locationLng }
        : null;
}

/* ---------------- Public API: combine Groq description + Unsplash image ---------------- */

export async function getLocationMedia(
    locationQuery: string
): Promise<{
    descriptionHtml: string;               // Groq-generated travel overview of the place
    images: string[];                      // single Unsplash image
    credit?: string;                       // Unsplash credit
    imageLocation?: { name?: string; lat?: number; lng?: number }; // Unsplash photo location (if any)
}> {
    // 1) Description from Groq (stable, place-focused)
    const descriptionHtml = await groqPlaceDescription(locationQuery);

    // 2) One Unsplash image for the place
    const q = `${locationQuery} landscape travel`;
    const media = await unsplashOneWithDetails(q);

    return {
        descriptionHtml,
        images: media?.url ? [media.url] : [],
        credit: media?.credit,
        imageLocation: media
            ? { name: media.locationName, lat: media.locationLat, lng: media.locationLng }
            : undefined,
    };
}
