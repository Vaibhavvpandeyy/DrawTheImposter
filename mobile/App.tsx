import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  PanResponder,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { io, Socket } from "socket.io-client";
import { StatusBar } from "expo-status-bar";

const C = {
  ink: "#20214B",
  purple: "#7256E8",
  mint: "#1DBF99",
  orange: "#FA9658",
  pink: "#F1799B",
  bg: "#F3F2FC",
  white: "#FFFFFF",
  muted: "#8585A1",
  line: "#E9E7F3",
};
function SmallText({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <Text style={[{ fontSize: 13, color: C.muted, marginVertical: 3 }, style]}>
      {children}
    </Text>
  );
}
type Stroke = {
  id: string;
  player?: string;
  color: string;
  width: number;
  points: { x: number; y: number }[];
};
type Player = { id: string; name: string; score: number; connected: boolean };
type Room = {
  code: string;
  hostId: string;
  phase: string;
  players: Player[];
  round: number;
  turnIndex: number;
  turnOrder: string[];
  deadline: number | null;
  canvas: Stroke[];
  previews: Stroke[];
  chat: any[];
};
export default function App() {
  const [url, setUrl] = useState(
      process.env.EXPO_PUBLIC_SERVER_URL || "http://192.168.1.100:3000",
    ),
    [name, setName] = useState(""),
    [code, setCode] = useState(""),
    [socket, setSocket] = useState<Socket | null>(null),
    [connected, setConnected] = useState(false),
    [connectionError, setConnectionError] = useState(""),
    [room, setRoom] = useState<Room | null>(null),
    [role, setRole] = useState<any>(null),
    [seconds, setSeconds] = useState(0),
    [color, setColor] = useState("#7256E8"),
    [tool, setTool] = useState<"pen" | "eraser">("pen"),
    [chat, setChat] = useState(""),
    [candidates, setCandidates] = useState<any[]>([]),
    [voted, setVoted] = useState(false),
    [myVote, setMyVote] = useState(""),
    [guess, setGuess] = useState("");
  const [previewStroke, setPreviewStroke] = useState<Stroke | null>(null);
  const current = useRef<any>(null),
    canvasSize = useRef({ width: 300, height: 300 }),
    lastPreviewAt = useRef(0),
    activeSocket = useRef<Socket | null>(null),
    activeRoom = useRef<Room | null>(null),
    activeName = useRef(name);
  activeSocket.current = socket;
  activeRoom.current = room;
  activeName.current = name;
  useEffect(() => {
    if (!room?.deadline) {
      setSeconds(0);
      return;
    }
    const tick = () =>
      setSeconds(Math.max(0, Math.ceil((room.deadline! - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 300);
    return () => clearInterval(id);
  }, [room?.deadline]);
  useEffect(
    () => () => {
      socket?.disconnect();
    },
    [socket],
  );
  const connect = () => {
    const address = url.trim().replace(/\/$/, "");
    if (!/^https?:\/\/[\w.:-]+$/.test(address))
      return Alert.alert(
        "Check the server address",
        "Enter the public game server URL, such as https://your-server.onrender.com",
      );
    setConnectionError("Connecting…");
    const s = io(address, {
      timeout: 7000,
      reconnection: true,
      reconnectionAttempts: Infinity,
    });
    s.on("connect", () => {
      setConnected(true);
      setConnectionError("");
      if (activeRoom.current && activeName.current)
        s.emit("room:reconnect", {
          code: activeRoom.current.code,
          name: activeName.current,
        });
    });
    s.on("disconnect", () => {
      setConnected(false);
      setConnectionError("Disconnected. Reconnecting…");
    });
    s.on("connect_error", (error) => {
      setConnected(false);
      setConnectionError(`Connection failed: ${error.message}`);
    });
    s.on("room:update", setRoom);
    s.on("chat:message", (m: any) =>
      setRoom((r: Room | null) =>
        r ? { ...r, chat: [...r.chat, m].slice(-60) } : r,
      ),
    );
    s.on("round:role", (nextRole: any) =>
      setRole((old: any) =>
        nextRole?.results && old?.results
          ? { ...old, ...nextRole, results: old.results }
          : nextRole,
      ),
    );
    s.on("round:results", (r) => {
      setRole((old: any) => ({ ...old, results: r }));
      setVoted(false);
      setMyVote("");
    });
    s.on("vote:open", (d: any) => {
      setCandidates(d.candidates);
      setVoted(false);
      setMyVote("");
    });
    s.on("vote:locked", () => setVoted(true));
    s.on("canvas:stroke", (st: Stroke) => {
      if (st.player === s.id) setPreviewStroke(null);
      setRoom((r: Room | null) =>
        r
          ? {
              ...r,
              previews: r.previews.filter((x) => x.player !== st.player),
              canvas: r.canvas.some((x) => x.id === st.id)
                ? r.canvas
                : [...r.canvas, st],
            }
          : r,
      );
    });
    s.on("canvas:preview", (preview: Stroke) => {
      setRoom((r: Room | null) =>
        r
          ? {
              ...r,
              previews: [
                ...r.previews.filter((x) => x.player !== preview.player),
                preview,
              ],
            }
          : r,
      );
    });
    s.on("canvas:preview:clear", ({ player }: { player: string }) => {
      setRoom((r: Room | null) =>
        r
          ? { ...r, previews: r.previews.filter((x) => x.player !== player) }
          : r,
      );
    });
    s.on("canvas:state", (canvas: Stroke[]) => {
      setRoom((r: Room | null) => (r ? { ...r, canvas } : r));
    });
    s.on("app:error", (e: any) => Alert.alert("Game", e.message));
    s.on("room:joined", (r: Room) => {
      setPreviewStroke(null);
      setRoom({ ...r, canvas: r.canvas || [], previews: r.previews || [] });
    });
    setSocket(s);
  };
  const act = (event: string, data?: any) => {
    const liveSocket = activeSocket.current;
    if (!liveSocket?.connected) {
      Alert.alert("Not connected", "Connect to the online game server first.");
      return;
    }
    liveSocket.emit(event, data);
  };
  const me = room?.players.find((p) => p.id === socket?.id),
    activeId = room?.turnOrder?.[room.turnIndex],
    active = room?.players.find((p) => p.id === activeId),
    myTurn = room?.phase === "drawing" && activeId === socket?.id;
  const drawEnabled =
    myTurn &&
    (room?.canvas || []).filter((s: any) => s.player === socket?.id).length < 3;
  const strokesUsed = (room?.canvas || []).filter(
    (s) => s.player === activeId,
  ).length;
  const canDraw = useRef(drawEnabled),
    ink = useRef(color),
    mode = useRef(tool);
  canDraw.current = drawEnabled;
  ink.current = color;
  mode.current = tool;
  const canvasRef = useRef<any>(null);
  const pointFromEvent = (event: any) => {
    const native = event.nativeEvent || event;
    let x = Number(native.locationX);
    let y = Number(native.locationY);
    if (
      Platform.OS === "web" &&
      canvasRef.current?.getBoundingClientRect &&
      Number.isFinite(Number(native.clientX ?? native.pageX))
    ) {
      const rect = canvasRef.current.getBoundingClientRect();
      x = Number(native.clientX ?? native.pageX) - rect.left;
      y = Number(native.clientY ?? native.pageY) - rect.top;
    }
    return {
      x: Math.max(0, Math.min(1, x / canvasSize.current.width)),
      y: Math.max(0, Math.min(1, y / canvasSize.current.height)),
    };
  };
  const finishCurrentStroke = () => {
    if (!current.current) return;
    const cur = current.current;
    current.current = null;
    act("canvas:stroke", { ...cur, points: [...cur.points] });
  };
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => canDraw.current,
      onMoveShouldSetPanResponder: () => canDraw.current,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: (e) => {
        if (!canDraw.current) return;
        finishCurrentStroke();
        const point = pointFromEvent(e);
        current.current = {
          id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
          points: [point],
          width: 5,
          color: ink.current,
          tool: mode.current,
        };
        lastPreviewAt.current = Date.now();
        const preview = {
          ...current.current,
          player: activeSocket.current?.id,
        };
        setPreviewStroke(preview);
        act("canvas:preview", preview);
      },
      onPanResponderMove: (e) => {
        if (!current.current) return;
        const cur = current.current;
        const nextPoint = pointFromEvent(e);
        const previous = cur.points[cur.points.length - 1];
        if (
          Math.hypot(nextPoint.x - previous.x, nextPoint.y - previous.y) < 0.003
        )
          return;
        if (cur.points.length >= 100)
          cur.points[cur.points.length - 1] = nextPoint;
        else cur.points.push(nextPoint);
        setPreviewStroke({
          ...cur,
          player: activeSocket.current?.id,
          points: [...cur.points],
        });
        const now = Date.now();
        if (now - lastPreviewAt.current >= 70) {
          lastPreviewAt.current = now;
          act("canvas:preview", { ...cur, points: [...cur.points] });
        }
      },
      onPanResponderRelease: () => {
        finishCurrentStroke();
      },
      onPanResponderTerminate: () => finishCurrentStroke(),
    }),
  ).current;
  const btn = (
    label: string,
    onPress: () => void,
    primary = false,
    disabled = false,
  ) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={{
        padding: 15,
        borderRadius: 16,
        backgroundColor: disabled ? C.line : primary ? C.purple : C.white,
        alignItems: "center",
        marginVertical: 6,
        borderWidth: primary ? 0 : 1,
        borderColor: C.line,
      }}
    >
      <Text
        style={{
          color: disabled ? C.muted : primary ? C.white : C.ink,
          fontWeight: "800",
          fontSize: 15,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
  const field = (
    value: string,
    onChangeText: (s: string) => void,
    placeholder: string,
    extra: any = {},
  ) => (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={C.muted}
      autoCapitalize="none"
      style={{
        backgroundColor: C.white,
        borderColor: C.line,
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 15,
        paddingVertical: 13,
        color: C.ink,
        marginVertical: 5,
        ...extra,
      }}
    />
  );
  const card = (children: any, style: any = {}) => (
    <View
      style={{
        backgroundColor: C.white,
        padding: 16,
        borderRadius: 20,
        marginVertical: 7,
        ...style,
      }}
    >
      {children}
    </View>
  );
  const title = (s: string) => (
    <Text
      style={{ fontSize: 21, fontWeight: "900", color: C.ink, marginBottom: 8 }}
    >
      {s}
    </Text>
  );
  const small = (s: string) => (
    <Text style={{ fontSize: 13, color: C.muted, marginVertical: 3 }}>{s}</Text>
  );
  const page =
    room?.phase === "lobby" ? (
      <>
        {card(
          <>
            {title(`ROOM ${room.code}`)}
            <Text style={{ color: C.muted }}>
              Share this code with your friends anywhere.
            </Text>
          </>,
          { backgroundColor: "#ECE9FF", alignItems: "center", padding: 24 },
        )}
        {card(
          <>
            {title(`Players · ${room.players.length}/5`)}
            {room.players.map((p) => (
              <Text
                key={p.id}
                style={{ fontSize: 16, color: C.ink, paddingVertical: 8 }}
              >
                🟣 {p.name} {p.id === room.hostId ? "👑 HOST" : ""}{" "}
                {p.connected ? "" : "· reconnecting"}
              </Text>
            ))}
          </>,
        )}
        {btn(
          room.players.length < 4
            ? `Waiting for ${4 - room.players.length} more player${4 - room.players.length === 1 ? "" : "s"}…`
            : "Start game · host",
          () => act("host:start"),
          true,
          room.players.length < 4 || room.hostId !== socket?.id,
        )}
        {small("The host starts when at least 4 players have joined.")}
      </>
    ) : room?.phase === "drawing" ? (
      <>
        {card(
          <>
            {title("✏️ Draw together")}
            {small(
              `Round ${room.round}${role?.category ? ` · ${role.category}` : ""}`,
            )}
            {room.deadline ? (
              <Text
                style={{
                  fontSize: 22,
                  color: C.purple,
                  fontWeight: "900",
                  marginTop: 6,
                }}
              >
                {seconds}s
              </Text>
            ) : (
              <SmallText>No turn timer — take your time.</SmallText>
            )}
            <Text
              style={{
                fontSize: 16,
                color: C.ink,
                fontWeight: "800",
                marginTop: 5,
              }}
            >
              {myTurn
                ? "Your turn!"
                : `${active?.name || "Next player"} is drawing`}
            </Text>
            <SmallText>
              {room.turnIndex + 1} of {room.players.length} turns ·{" "}
              {Math.max(0, 3 - strokesUsed)} strokes left this turn
            </SmallText>
          </>,
          { alignItems: "center" },
        )}
        {card(
          <View
            ref={canvasRef}
            {...responder.panHandlers}
            onLayout={(e) => {
              canvasSize.current = {
                width: e.nativeEvent.layout.width,
                height: e.nativeEvent.layout.height,
              };
            }}
            style={{
              height: 300,
              width: "100%",
              backgroundColor: "#fff",
              borderRadius: 12,
              overflow: "hidden",
              ...(Platform.OS === "web"
                ? ({ touchAction: "none", userSelect: "none" } as any)
                : {}),
            }}
          >
            <Svg width="100%" height="100%" viewBox="0 0 300 300">
              <Rect x="0" y="0" width="300" height="300" fill="#FFFFFF" />
              {room.canvas.map((s: any) => (
                <Path
                  key={s.id}
                  d={s.points
                    .map(
                      (p: any, i: number) =>
                        `${i ? "L" : "M"}${p.x * 300},${p.y * 300}`,
                    )
                    .join(" ")}
                  stroke={s.color}
                  strokeWidth={s.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ))}
              {[
                ...room.previews,
                ...(previewStroke ? [previewStroke] : []),
              ].map((s) => (
                <Path
                  key={`${s.player || "local"}-${s.id}`}
                  d={s.points
                    .map(
                      (p: any, i: number) =>
                        `${i ? "L" : "M"}${p.x * 300},${p.y * 300}`,
                    )
                    .join(" ")}
                  stroke={s.color}
                  strokeWidth={s.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              ))}
            </Svg>
          </View>,
        )}
        {card(
          <>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                marginBottom: 9,
              }}
            >
              {["#7256E8", "#FA9658", "#1DBF99", "#F1799B", "#20214B"].map(
                (c) => (
                  <TouchableOpacity
                    key={c}
                    onPress={() => setColor(c)}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 20,
                      backgroundColor: c,
                      borderWidth: color === c ? 3 : 0,
                      borderColor: C.ink,
                    }}
                  />
                ),
              )}
            </View>
            <View
              style={{ flexDirection: "row", justifyContent: "space-evenly" }}
            >
              {btn("🖊 Pen", () => setTool("pen"), tool === "pen")}
              {btn("◻ Eraser", () => setTool("eraser"), tool === "eraser")}
            </View>
            {btn(
              "Clear my marks",
              () => act("canvas:clear-own"),
              false,
              !myTurn || !room.canvas.some((s) => s.player === socket?.id),
            )}
            {btn("Done ✓", () => act("turn:done"), false, !myTurn)}
            {!myTurn &&
              small("The canvas is view-only while another player draws.")}
          </>,
        )}
        {card(
          <>
            {title("Players")}
            {room.players.map((p, i) => (
              <SmallText key={p.id}>
                {i + 1}. {p.name} · {p.score} points{" "}
                {p.id === activeId ? " ← drawing" : ""}
              </SmallText>
            ))}
          </>,
        )}
      </>
    ) : room?.phase === "discussion" ||
      room?.phase === "voting" ||
      room?.phase === "revote" ? (
      <>
        {card(
          <>
            {title(
              room.phase === "discussion"
                ? "💬 Discuss!"
                : room.phase === "revote"
                  ? "↻ Revote"
                  : "🗳 Cast your vote",
            )}
            {small(
              `${seconds}s remaining · The word stays secret until voting ends.`,
            )}
          </>,
          { alignItems: "center" },
        )}
        {room.phase !== "discussion" &&
          card(
            <>
              {title("Who is the Imposter?")}
              {candidates
                .filter((x) => x.id !== socket?.id)
                .map((c) =>
                  btn(
                    `${myVote === c.id ? "✓  " : ""}${c.name}`,
                    () => setMyVote(c.id),
                    myVote === c.id,
                  ),
                )}
              {btn(
                voted
                  ? "Vote locked"
                  : `Vote${myVote ? " for " + candidates.find((c) => c.id === myVote)?.name : ""}`,
                () => myVote && act("vote:submit", { target: myVote }),
                true,
                voted || !myVote,
              )}
            </>,
          )}
        {card(
          <>
            {title("Table chat")}
            {
              <ScrollView style={{ maxHeight: 170 }}>
                {room.chat.map((m: any, i: number) => (
                  <Text key={i} style={{ paddingVertical: 3, color: C.ink }}>
                    <Text style={{ fontWeight: "800" }}>{m.name}: </Text>
                    {m.text}
                  </Text>
                ))}
              </ScrollView>
            }
            {field(chat, setChat, "Type a message", { maxLength: 200 })}
            {btn(
              "Send message",
              () => {
                act("chat:send", { text: chat });
                setChat("");
              },
              true,
              !chat.trim(),
            )}
          </>,
        )}
      </>
    ) : room?.phase === "results" ? (
      <>
        {card(
          <>
            {title("🏁 The round is over")}
            {small(`The word was ${role?.results?.category || ""}:`)}
            <Text style={{ fontSize: 32, fontWeight: "900", color: C.purple }}>
              {role?.results?.word || "••••"}
            </Text>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: C.ink,
                marginTop: 10,
              }}
            >
              🕵️ {role?.results?.imposterName || "Imposter"}
            </Text>
            <Text
              style={{
                fontSize: 19,
                fontWeight: "900",
                color: C.mint,
                marginVertical: 9,
              }}
            >
              {role?.results?.winner === "players"
                ? "🎉 Players win!"
                : "🕵️ Imposter wins!"}
            </Text>
          </>,
        )}
        {card(
          <>
            {title("Votes")}
            {(role?.results?.tally || []).map((x: any) => (
              <SmallText key={x.id}>
                {x.name} · {x.count} vote{x.count === 1 ? "" : "s"}
              </SmallText>
            ))}
            {role?.results?.tied ? (
              <SmallText>It was still tied—the Imposter wins.</SmallText>
            ) : null}
          </>,
        )}
        {me?.id === role?.results?.imposterId && !role.results?.guess && (
          <>
            {card(
              <>
                {title("Guess the secret word")}
                {field(guess, setGuess, "Your final guess")}
              </>,
            )}
            {btn(
              "Submit guess",
              () => act("imposter:guess", { word: guess }),
              true,
              !guess.trim(),
            )}
          </>
        )}
        {role?.results?.guess &&
          card(
            <Text style={{ color: C.ink, fontWeight: "800" }}>
              Imposter guessed {role.results.guess.text}:{" "}
              {role.results.guess.correct
                ? "correct! +1 bonus point"
                : "not quite."}
            </Text>,
          )}
        {card(
          <>
            {title("Scoreboard")}
            {room.players.map((p) => (
              <SmallText key={p.id}>
                {p.name} · {p.score} points
              </SmallText>
            ))}
          </>,
        )}
        {btn(
          "Play again · host",
          () => act("round:again"),
          true,
          room.hostId !== socket?.id,
        )}
      </>
    ) : (
      <>
        {card(
          <>
            {title("Draw the Imposter")}
            {small(
              "A party drawing game for 4–5 friends. Play together from anywhere.",
            )}
          </>,
        )}
        {card(
          <>
            {title("Connect to the game server")}
            {field(url, setUrl, "http://192.168.1.25:3000", {
              keyboardType: "url",
              autoCapitalize: "none",
            })}
            {btn(
              connected ? "● Connected" : "Connect",
              connect,
              true,
              !url.trim(),
            )}
            {small(
              connected
                ? "Connected to the online game server."
                : "The server is hosted online, so players can use different networks.",
            )}
          </>,
        )}
        {connected &&
          card(
            <>
              {title("Your name")}
              {field(name, setName, "Choose a name", { maxLength: 18 })}
              {btn(
                "Create room",
                () => act("room:create", { name }),
                true,
                !name.trim(),
              )}
              {
                <View
                  style={{
                    height: 1,
                    backgroundColor: C.line,
                    marginVertical: 12,
                  }}
                />
              }
              {field(code, setCode, "4-character room code", { maxLength: 4 })}
              {btn(
                "Join room",
                () => act("room:join", { name, code }),
                false,
                !name.trim() || code.length !== 4,
              )}
              {btn(
                "Reconnect to room",
                () => act("room:reconnect", { name, code }),
                false,
                !name.trim() || code.length !== 4,
              )}
            </>,
          )}
      </>
    );
  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            padding: 18,
            paddingTop: 45,
            paddingBottom: 32,
          }}
          keyboardShouldPersistTaps="handled"
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 27 }}>🎨 </Text>
            <View>
              <Text style={{ color: C.ink, fontWeight: "900", fontSize: 20 }}>
                Draw the Imposter
              </Text>
              <Text
                style={{ color: connected ? C.mint : C.muted, fontSize: 12 }}
              >
                {connected
                  ? "● Connected to local server"
                  : `○ ${connectionError || "Not connected"}`}
              </Text>
            </View>
            {room ? (
              <TouchableOpacity
                style={{ marginLeft: "auto", padding: 10 }}
                onPress={() => {
                  socket?.disconnect();
                  setSocket(null);
                  setRoom(null);
                  setRole(null);
                }}
              >
                <Text style={{ color: C.purple, fontWeight: "800" }}>
                  Leave
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
          {room && role && !role.results ? (
            <View
              style={{
                padding: 14,
                borderRadius: 16,
                backgroundColor: role.imposter ? "#FFF0E9" : "#E8F8F2",
                marginBottom: 10,
              }}
            >
              <Text style={{ fontWeight: "900", fontSize: 15, color: C.ink }}>
                {role.imposter
                  ? "🕵️ You are the Imposter! Blend in."
                  : `🔒 Your word: ${role.word}`}
              </Text>
              <Text style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
                {role.imposter
                  ? "Observe the drawing and draw convincingly."
                  : "Keep your word secret. One player does not know it."}
              </Text>
            </View>
          ) : null}
          {page}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
