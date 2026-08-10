export function extractVideoId(url) {

    const regex =
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/;

    const match = url.match(regex);

    if (match) {
        return match[1];
    }

    return null;
}