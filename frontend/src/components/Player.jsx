import { useEffect, useRef } from "react";
import socket from "../socket";

function Player({ videoId, role }) {
    console.log("Player received role:", role);
    const playerContainerRef = useRef(null);
    const playerRef = useRef(null);
    const roleRef = useRef("");
    const ignoreNextStateChangeRef = useRef(false);

    // Create the YouTube player once
    useEffect(() => {
        // If the API is already loaded, create the player immediately
        if (window.YT && window.YT.Player) {
            createPlayer();
            return;
        }

        // Load the YouTube IFrame API
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.body.appendChild(script);

        // Called automatically when the API finishes loading
        window.onYouTubeIframeAPIReady = () => {
            createPlayer();
        };
    }, []);

    useEffect(() => {
        roleRef.current = role;
    }, [role]);

    // create Player for the host and guest
    function createPlayer() {
        if (playerRef.current) return;

        playerRef.current = new window.YT.Player(playerContainerRef.current, {            
            videoId: "",

            events: {
                onReady: onPlayerReady,
                onStateChange: onPlayerStateChange,
            },
        });
    }

    // Load a new video whenever videoId changes
    useEffect(() => {
        if (!videoId) return;
        if (!playerRef.current) return;

        playerRef.current.cueVideoById(videoId);
    }, [videoId]);

    // for guest role, listen for events from the server
    useEffect(() => {
        function handlePlay() {
            console.log("Received play event");

            if (roleRef.current !== "guest") return;
            if (!playerRef.current) return;

            ignoreNextStateChangeRef.current = true;
            playerRef.current.playVideo();
        }

        socket.on("play", handlePlay);

        return () => {
            socket.off("play", handlePlay);
        };
    }, []);

    // for guest role, listen for pause events from the server

    useEffect(() => {
        function handlePause() {
            console.log("Received pause event");

            if (roleRef.current !== "guest") return;
            if (!playerRef.current) return;

            ignoreNextStateChangeRef.current = true;
            playerRef.current.pauseVideo();
        }

        socket.on("pause", handlePause);

        return () => {
            socket.off("pause", handlePause);
        };
    }, []);

    // seek event listener for guest role
    useEffect(() => {
        function handleSeek(currentTime) {
            console.log("Received seek event:", currentTime);

            if (roleRef.current !== "guest") return;
            if (!playerRef.current) return;

            ignoreNextStateChangeRef.current = true;
            playerRef.current.seekTo(currentTime, true);
        }

        socket.on("seek", handleSeek);

        return () => {
            socket.off("seek", handleSeek);
        };
    }, []);

    // Listen for sync requests from guests
    useEffect(() => {
        function handleRequestSync(guestSocketId) {
            if (roleRef.current !== "host") return;
            if (!playerRef.current) return;

            const currentTime = playerRef.current.getCurrentTime();
            const playerState = playerRef.current.getPlayerState();

            console.log("Sync requested by guest:", guestSocketId);
            console.log("Host current time:", currentTime);

            socket.emit("syncResponse", {
                guestSocketId,
                currentTime,
                isPlaying:
                    playerState === window.YT.PlayerState.PLAYING,
            });
        }

        socket.on("requestSync", handleRequestSync);

        return () => {
            socket.off("requestSync", handleRequestSync);
        };
    }, []);

    // Listen for sync responses from the host

    useEffect(() => {
        function handleSyncState({ currentTime, isPlaying }) {
            console.log("Received sync state:", currentTime, isPlaying);

            if (roleRef.current !== "guest") return;
            if (!playerRef.current) return;

            ignoreNextStateChangeRef.current = true;

            playerRef.current.seekTo(currentTime, true);

            if (isPlaying) {
                playerRef.current.playVideo();
            } else {
                playerRef.current.pauseVideo();
            }
        }

        socket.on("syncState", handleSyncState);

        return () => {
            socket.off("syncState", handleSyncState);
        };
    }, []);

    function onPlayerReady() {
        console.log("Player is ready.");

        if (roleRef.current === "guest") {
            socket.emit("playerReady");
        }
    }

    function onPlayerStateChange(event) {

        if (ignoreNextStateChangeRef.current) {
            ignoreNextStateChangeRef.current = false;
            console.log("Ignoring programmatic state change");
            return;
        }

        switch (event.data) {
            case window.YT.PlayerState.UNSTARTED:
                console.log("UNSTARTED");
                break;

            case window.YT.PlayerState.ENDED:
                console.log("ENDED");
                break;

            case window.YT.PlayerState.PLAYING:
                console.log("Current role:", roleRef.current);
                console.log("PLAYING");


                if (roleRef.current === "host") {
                    console.log("Host is emitting play");
                    socket.emit("play")
                }

                break;

            case window.YT.PlayerState.PAUSED:
                console.log("PAUSED");

                if (roleRef.current === "host") {
                    console.log("Host is emitting pause");
                    socket.emit("pause");
                }

                break;

            case window.YT.PlayerState.BUFFERING:
                console.log("BUFFERING");

                if (roleRef.current === "host") {
                    const currentTime = playerRef.current.getCurrentTime();

                    console.log("Host is emitting seek:", currentTime);

                    socket.emit("seek", currentTime);
                }

                break;

            case window.YT.PlayerState.CUED:
                console.log("CUED");

                if (roleRef.current === "guest") {
                    socket.emit("videoCued");
                }

                break;

            default:
                console.log("UNKNOWN STATE:", event.data);
        }
    }

    return (
        <div>
            <h2>YouTube Player</h2>

            <div ref={playerContainerRef} className="player"></div>
        </div>
    );
}

export default Player;