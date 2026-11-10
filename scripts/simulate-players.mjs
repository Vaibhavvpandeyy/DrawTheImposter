import { io } from "socket.io-client";

const code = String(process.argv[2] || "")
  .trim()
  .toUpperCase();
const botCount = Math.max(1, Math.min(10, Number.parseInt(process.argv[3] || "2", 10) || 2));
const serverUrl = process.env.SERVER_URL || "http://127.0.0.1:3000";
const names = Array.from({ length: botCount }, (_, index) => `LaptopBot${index + 1}`);
const clients = [];

if (!/^[A-Z0-9]{4}$/.test(code)) {
  console.error("Usage: npm run simulate -- ROOMCODE [BOT_COUNT]");
  process.exit(2);
}

function waitFor(socket, event, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      socket.off(event, onEvent);
      reject(new Error(`Timed out waiting for ${event}.`));
    }, timeoutMs);
    const onEvent = (value) => {
      clearTimeout(timer);
      resolve(value);
    };
    socket.once(event, onEvent);
  });
}

function joinRoom(socket, roomCode, name) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      socket.off("room:joined", onJoined);
      socket.off("app:error", onError);
    };
    const onJoined = (room) => {
      cleanup();
      resolve(room);
    };
    const onError = (error) => {
      cleanup();
      reject(new Error(error.message));
    };
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error("Timed out waiting for the room join response."));
    }, 10000);

    socket.once("room:joined", onJoined);
    socket.once("app:error", onError);
    socket.emit("room:join", { code: roomCode, name });
  });
}

try {
  for (const name of names) {
    const socket = io(serverUrl, { timeout: 7000, reconnection: false });
    clients.push(socket);
    const completedTurns = new Set();
    socket.on("room:update", (room) => {
      if (
        room.phase !== "drawing" ||
        room.turnOrder[room.turnIndex] !== socket.id
      )
        return;
      const key = `${room.round}:${room.turnIndex}`;
      if (completedTurns.has(key)) return;
      completedTurns.add(key);
      setTimeout(() => {
        if (socket.connected) socket.emit("turn:done");
      }, 250);
    });
    await waitFor(socket, "connect");

    await joinRoom(socket, code, name);
    console.log(`${name} joined room ${code}.`);
  }

  console.log("Both test players are connected. Press Ctrl+C to remove them.");
  await new Promise((resolve) => {
    process.once("SIGINT", resolve);
    process.once("SIGTERM", resolve);
  });
} catch (error) {
  console.error(`Could not add test players: ${error.message}`);
  process.exitCode = 1;
} finally {
  for (const socket of clients) socket.disconnect();
}
