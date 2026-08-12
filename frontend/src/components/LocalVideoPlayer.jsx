import { useEffect, useRef, useState } from "react";

function LocalVideoPlayer({ role }) {
    const videoRef = useRef(null);
    const [videoUrl, setVideoUrl] = useState("");

    function handleFileChange(event) {
        const file = event.target.files[0];

        if (!file) {
            return;
        }

        const url = URL.createObjectURL(file);

        setVideoUrl(url);
    }

    useEffect(() => {
        return () => {
            if (videoUrl) {
                URL.revokeObjectURL(videoUrl);
            }
        };
    }, [videoUrl]);

    return (
        <>
            <h2>Local Video</h2>

            <input
                type="file"
                accept="video/*"
                onChange={handleFileChange}
            />

            {videoUrl && (
                <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    width="600"
                />
            )}

            <p>Role: {role || "None"}</p>
        </>
    );
}

export default LocalVideoPlayer;