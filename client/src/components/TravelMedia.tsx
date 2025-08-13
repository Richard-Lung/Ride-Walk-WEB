// Shows: place description (Wikipedia) + ONE Unsplash image with credit and exact location (if available).
// Expects: { descriptionHtml: string; images: string[]; credit?: string; imageLocation?: { name?: string; lat?: number; lng?: number } }

function fmtCoord(n?: number) {
    return typeof n === "number" && isFinite(n) ? n.toFixed(5) : undefined;
}

export default function TravelMedia({ data, title }: { data: any; title?: string }) {
    if (!data) return null;

    const html = data.descriptionHtml || ""; // <- place description (Wikipedia)
    const img: string | undefined = Array.isArray(data.images) ? data.images[0] : undefined; // <- Unsplash
    const credit: string | undefined = data.credit;
    const loc = data.imageLocation || {};
    const locName: string | undefined = loc.name;
    const latS = fmtCoord(loc.lat);
    const lngS = fmtCoord(loc.lng);

    if (!html && !img) return null;

    return (
        <div className="card">
            {title && <h3 className="font-semibold mb-3">{title}</h3>}

            {html && (
                <div
                    className="prose prose-sm dark:prose-invert max-w-none mb-4"
                    // Wikipedia summary HTML is sanitized by the API
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            )}

            {img && (
                <div className="grid gap-1">
                    <img
                        src={img}
                        alt={locName || ""}
                        loading="lazy"
                        className="rounded-md aspect-[16/9] object-cover border border-border"
                    />
                    {(credit || locName || (latS && lngS)) && (
                        <div className="text-[11px] text-muted-foreground">
                            {credit ? `Image: ${credit}` : "Image"}
                            {locName ? ` — Location: ${locName}` : ""}
                            {!locName && latS && lngS ? ` — Location: ${latS}, ${lngS}` : ""}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
