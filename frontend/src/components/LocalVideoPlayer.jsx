import { useEffect, useRef, useState } from "react";
import socket from "../socket";

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

    function handlePlay() {
        if (role !== "host") {
            return;
        }

        console.log("Host played local video");

        socket.emit("localVideoPlay");
    }

    function handlePause() {
        if (role !== "host") {
            return;
        }

        console.log("Host paused local video");

        socket.emit("localVideoPause");
    }

    useEffect(() => {
        function handleGuestPlay() {
            if (role !== "guest") {
                return;
            }

            console.log("Guest received local play");

            videoRef.current?.play();
        }

        function handleGuestPause() {
            if (role !== "guest") {
                return;
            }

            console.log("Guest received local pause");

            videoRef.current?.pause();
        }

        socket.on("localVideoPlay", handleGuestPlay);
        socket.on("localVideoPause", handleGuestPause);

        return () => {
            socket.off("localVideoPlay", handleGuestPlay);
            socket.off("localVideoPause", handleGuestPause);
        };
    }, [role]);

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
                    onPlay={handlePlay}
                    onPause={handlePause}
                />
            )}

            <p>Role: {role || "None"}</p>
        </>
    );
}

export default LocalVideoPlayer;