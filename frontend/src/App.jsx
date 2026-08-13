import { useEffect, useState } from "react";
import Player from "./components/Player";
import LocalVideoPlayer from "./components/LocalVideoPlayer";
import socket from "./socket";
import { extractVideoId } from "./services/youtube";

function App() {
    const [role, setRole] = useState("");
    const [videoUrl, setVideoUrl] = useState("");
    const [videoId, setVideoId] = useState("");
    const [isConnected, setIsConnected] = useState(socket.connected);
    const [room, setRoom] = useState("");

    useEffect(() => {
        function handleConnect() {
            console.log("Connected to server");
            setIsConnected(true);
        }

        function handleDisconnect() {
            console.log("Disconnected from server");
            setIsConnected(false);
        }

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);

        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
        };
    }, []);

    useEffect(() => {
        function handleRoleAssigned(newRole) {
            console.log("Server assigned role:", newRole);
            setRole(newRole);
        }

        socket.on("roleAssigned", handleRoleAssigned);

        return () => {
            socket.off("roleAssigned", handleRoleAssigned);
        };
    }, []);

    function loadVideo() {
        const id = extractVideoId(videoUrl);

        if (!id) {
            alert("Invalid YouTube URL");
            return;
        }

        setVideoId(id);

        if (role === "host") {
            socket.emit("loadVideo", id);
        }
    }

    function sayHello() {
        socket.emit("hello", "Hello from the frontend!");
    }

    function joinRoom() {
        if (!room) {
            alert("Please enter a room name");
            return;
        }

        setRole("");

        socket.emit("joinRoom", room);
    }

    function becomeHost() {
        socket.emit("requestHost");
    }

    useEffect(() => {
        socket.on("welcome", (message) => {
            console.log("Server says:", message);
        });

        return () => {
            socket.off("welcome");
        };
    }, []);

    useEffect(() => {
        console.log("App socket connected:", socket.connected);

        socket.on("connect", () => {
            console.log("App connected with id:", socket.id);
        });
    }, []);

    useEffect(() => {
        socket.on("loadVideo", (videoId) => {
            console.log("Received video:", videoId);

            setVideoId(videoId);
        });

        return () => {
            socket.off("loadVideo");
        };
    }, []);

    return (
        <>
            <h1>Watch2Gether</h1>

            <p>
                Connection Status:{" "}
                {isConnected ? "🟢 Connected" : "🔴 Disconnected"}
            </p>

            <h2>Join Room</h2>

            <input
                type="text"
                placeholder="Enter room name"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
            />

            <button onClick={joinRoom}>
                Join Room
            </button>

            <p>Current Room: {room || "None"}</p>

            <p>Current Role: {role || "None"}</p>

            <button onClick={becomeHost}>
                Become Host
            </button>

            <hr />

            <input
                type="text"
                placeholder="Paste YouTube URL"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
            />

            

            {/* <button onClick={sayHello}>
                Say Hello
            </button> */}

            

            <button onClick={loadVideo}>
                Load Video
            </button>

            <br></br>

            <button onClick={() => setVideoUrl("")}>
                Clear
            </button>
            
            

            <Player videoId={videoId} role={role} />
            <hr />

            <LocalVideoPlayer role={role} />
        </>
    );
}

export default App;