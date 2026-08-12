import { useEffect, useRef, useState } from "react";
import socket from "../socket";
import "./Player.css";

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

    function handleSeeked() {
        if (role !== "host") {
            return;
        }

        const currentTime = videoRef.current.currentTime;

        console.log("Host seeked local video:", currentTime);

        socket.emit("localVideoSeek", currentTime);
    }

    function handleLoadedMetadata() {
        console.log("Local video metadata loaded");

        socket.emit("localVideoReady");
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

    useEffect(() => {
        function handleGuestSeek(currentTime) {
            if (role !== "guest") {
                return;
            }

            console.log("Guest received local seek:", currentTime);

            if (videoRef.current) {
                videoRef.current.currentTime = currentTime;
            }
        }

        socket.on("localVideoSeek", handleGuestSeek);

        return () => {
            socket.off("localVideoSeek", handleGuestSeek);
        };
    }, [role]);

    useEffect(() => {
        function handleLocalVideoSync(state) {
            if (role !== "guest") {
                return;
            }

            console.log("Received local video sync:", state);

            if (!videoRef.current) {
                return;
            }

            videoRef.current.currentTime = state.currentTime;

            if (state.isPlaying) {
                videoRef.current.play();
            } else {
                videoRef.current.pause();
            }
        }

        socket.on("localVideoSync", handleLocalVideoSync);

        return () => {
            socket.off("localVideoSync", handleLocalVideoSync);
        };
    }, [role]);

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
                    onLoadedMetadata={handleLoadedMetadata}
                    onPlay={handlePlay}
                    onPause={handlePause}
                    onSeeked={handleSeeked}
                />
            )}

            <p>Role: {role || "None"}</p>
        </>
    );
}

export default LocalVideoPlayer;