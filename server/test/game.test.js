import { test } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { io as client } from "socket.io-client";

test("four LAN clients create a room, receive private roles and synchronize turns", async (t) => {
  const port = 34000 + Math.floor(Math.random() * 1000);
  const proc = spawn(process.execPath, ["src/index.js"], {
    cwd: fileURLToPath(new URL("../", import.meta.url)),
    env: {
      ...process.env,
      PORT: String(port),
      DISCUSS_SECONDS: "40",
      VOTE_SECONDS: "40",
    },
    stdio: "inherit",
  });
  const sockets = [];
  t.after(() => {
    for (const s of sockets) s.disconnect();
    proc.kill();
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(
          new Error(
            "server did not start; client could not connect to local TCP port",
          ),
        ),
      5000,
    );
    proc.on("error", reject);
    const probe = client(`http://127.0.0.1:${port}`, { reconnection: false });
    probe.on("connect", () => {
      clearTimeout(timer);
      probe.disconnect();
      resolve();
    });
    probe.on("connect_error", (e) => {
      if (proc.exitCode !== null) {
        clearTimeout(timer);
        reject(new Error(`server exited ${proc.exitCode}: ${e.message}`));
      }
    });
  });
  const connect = () =>
    new Promise((resolve, reject) => {
      const s = client(`http://127.0.0.1:${port}`);
      sockets.push(s);
      s.on("connect", () => resolve(s));
      s.on("connect_error", reject);
    });
  const players = await Promise.all(Array.from({ length: 4 }, connect));
  const wait = (s, event) => new Promise((resolve) => s.once(event, resolve));
  const hostJoined = wait(players[0], "room:joined");
  players[0].emit("room:create", { name: "Player1" });
  const joined = await hostJoined;
  for (let i = 1; i < 4; i++) {
    const ack = wait(players[i], "room:joined");
    players[i].emit("room:join", { name: `Player${i + 1}`, code: joined.code });
    await ack;
  }
  assert.equal(joined.players.length, 1);
  const updates = players.map((s) => wait(s, "room:update"));
  const rolePromises = players.map((s) => wait(s, "round:role"));
  players[0].emit("host:start");
  const roles = await Promise.all(rolePromises);
  const snapshots = await Promise.all(updates);
  assert.equal(roles.filter((r) => r.imposter).length, 1);
  assert.equal(roles.filter((r) => !r.imposter && r.word).length, 3);
  assert.ok(roles.find((r) => r.imposter).word === undefined);
  assert.ok(snapshots.every((r) => r.phase === "drawing"));
  assert.ok(snapshots.every((r) => r.deadline === null));
  assert.ok(snapshots.every((r) => !("word" in r) && !("imposterId" in r)));
  assert.ok(snapshots.every((r) => !("category" in r)));
  const current = players.find(
    (s) => snapshots[0].turnOrder[snapshots[0].turnIndex] === s.id,
  );
  const observer = players.find((s) => s !== current);
  const previewEvent = wait(observer, "canvas:preview");
  current.emit("canvas:preview", {
    id: "preview-test",
    color: "#7256E8",
    tool: "pen",
    width: 5,
    points: [{ x: 0.2, y: 0.3 }],
  });
  const preview = await previewEvent;
  assert.equal(preview.player, current.id);
  const event = wait(players[0], "canvas:stroke");
  current.emit("canvas:stroke", {
    color: "#7256E8",
    tool: "pen",
    points: [{ x: 0.2, y: 0.3 }],
  });
  const stroke = await event;
  assert.equal(stroke.points[0].x, 0.2);
  const outsider = players.find((s) => s !== current);
  const unexpectedStroke = await new Promise((resolve) => {
    const listener = (stroke) => resolve(stroke);
    players[0].once("canvas:stroke", listener);
    outsider.emit("canvas:stroke", {
      color: "#7256E8",
      tool: "pen",
      points: [{ x: 0.4, y: 0.4 }],
    });
    setTimeout(() => {
      players[0].off("canvas:stroke", listener);
      resolve(undefined);
    }, 100);
  });
  assert.equal(unexpectedStroke, undefined);
  const before = snapshots[0].canvas.length;
  const update = wait(players[0], "room:update");
  current.emit("turn:done");
  const after = await update;
  assert.ok(after.turnIndex > 0 || after.phase === "discussion");
  assert.ok(before === 0);
});
