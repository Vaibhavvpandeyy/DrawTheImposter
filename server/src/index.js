import { createServer } from "node:http";
import os from "node:os";
import { Server } from "socket.io";
import { randomInt, randomUUID } from "node:crypto";

const PORT = Number(process.env.PORT || 3000);
const DISCUSS_MS = Number(process.env.DISCUSS_SECONDS || 45) * 1000;
const VOTE_MS = Number(process.env.VOTE_SECONDS || 30) * 1000;
const WORDS = {
  "Animals": [
    "Lion",
    "Tiger",
    "Elephant",
    "Giraffe",
    "Zebra",
    "Monkey",
    "Gorilla",
    "Kangaroo",
    "Panda",
    "Bear",
    "Wolf",
    "Fox",
    "Deer",
    "Rabbit",
    "Squirrel",
    "Horse",
    "Donkey",
    "Camel",
    "Cow",
    "Buffalo",
    "Goat",
    "Sheep",
    "Pig",
    "Dog",
    "Cat",
    "Leopard",
    "Cheetah",
    "Panther",
    "Hyena",
    "Crocodile",
    "Alligator",
    "Snake",
    "Python",
    "Lizard",
    "Turtle",
    "Tortoise",
    "Frog",
    "Toad",
    "Dolphin",
    "Whale",
    "Shark",
    "Octopus",
    "Jellyfish",
    "Crab",
    "Lobster",
    "Penguin",
    "Peacock",
    "Parrot",
    "Eagle",
    "Owl",
    "Sparrow",
    "Pigeon",
    "Crow",
    "Flamingo",
    "Ostrich",
    "Duck",
    "Swan",
    "Hen",
    "Rooster",
    "Bat",
    "Rat",
    "Mouse",
    "Hamster",
    "Hedgehog",
    "Porcupine",
    "Sloth",
    "Koala",
    "Chimpanzee",
    "Rhinoceros",
    "Hippopotamus",
    "Gorilla",
    "Meerkat",
    "Otter",
    "Seal",
    "Walrus",
    "Starfish",
    "Seahorse",
    "Butterfly",
    "Honeybee",
    "Ant",
    "Mosquito",
    "Spider",
    "Scorpion",
    "Grasshopper",
    "Ladybug",
    "Snail",
    "Earthworm",
    "Centipede",
    "Moth",
    "Dragonfly",
    "Turkey",
    "Goose",
    "Falcon",
    "Vulture",
    "Raccoon",
    "Skunk",
    "Badger",
    "Llama",
    "Alpaca",
    "Bison"
  ],
  "Food": [
    "Pizza",
    "Burger",
    "Pasta",
    "Noodles",
    "Sandwich",
    "Biryani",
    "Pulao",
    "Dosa",
    "Idli",
    "Samosa",
    "Kachori",
    "Momos",
    "Spring Roll",
    "Manchurian",
    "Fried Rice",
    "Tacos",
    "Nachos",
    "Sushi",
    "Ramen",
    "Lasagna",
    "Pancake",
    "Waffle",
    "Donut",
    "Croissant",
    "Muffin",
    "Brownie",
    "Cupcake",
    "Cheesecake",
    "Ice Cream",
    "Chocolate",
    "Popcorn",
    "French Fries",
    "Potato Chips",
    "Garlic Bread",
    "Hot Dog",
    "Shawarma",
    "Kebab",
    "Tandoori Chicken",
    "Butter Chicken",
    "Paneer Tikka",
    "Chole Bhature",
    "Rajma Chawal",
    "Dal Makhani",
    "Palak Paneer",
    "Aloo Paratha",
    "Puri",
    "Pakora",
    "Dhokla",
    "Pav Bhaji",
    "Vada Pav",
    "Pani Puri",
    "Bhel Puri",
    "Jalebi",
    "Gulab Jamun",
    "Rasgulla",
    "Barfi",
    "Ladoo",
    "Kheer",
    "Halwa",
    "Kulfi",
    "Apple",
    "Banana",
    "Mango",
    "Orange",
    "Grapes",
    "Watermelon",
    "Pineapple",
    "Papaya",
    "Strawberry",
    "Blueberry",
    "Pomegranate",
    "Guava",
    "Coconut",
    "Kiwi",
    "Peach",
    "Pear",
    "Cherry",
    "Avocado",
    "Carrot",
    "Potato",
    "Tomato",
    "Onion",
    "Cucumber",
    "Broccoli",
    "Cauliflower",
    "Spinach",
    "Mushroom",
    "Corn",
    "Peas",
    "Cabbage",
    "Pumpkin",
    "Beetroot",
    "Radish",
    "Garlic",
    "Ginger",
    "Cheese",
    "Butter",
    "Yogurt",
    "Bread",
    "Omelette"
  ],
  "Objects": [
    "Laptop",
    "Smartphone",
    "Television",
    "Remote",
    "Keyboard",
    "Mouse",
    "Headphones",
    "Speaker",
    "Camera",
    "Tripod",
    "Charger",
    "Power Bank",
    "Watch",
    "Sunglasses",
    "Wallet",
    "Backpack",
    "Suitcase",
    "Umbrella",
    "Bottle",
    "Mug",
    "Glass",
    "Plate",
    "Spoon",
    "Fork",
    "Knife",
    "Bowl",
    "Pan",
    "Cooker",
    "Kettle",
    "Toaster",
    "Refrigerator",
    "Microwave",
    "Washing Machine",
    "Iron",
    "Fan",
    "AC",
    "Lamp",
    "Torch",
    "Candle",
    "Clock",
    "Mirror",
    "Comb",
    "Hairbrush",
    "Toothbrush",
    "Toothpaste",
    "Soap",
    "Shampoo",
    "Towel",
    "Pillow",
    "Blanket",
    "Mattress",
    "Chair",
    "Table",
    "Sofa",
    "Bed",
    "Wardrobe",
    "Drawer",
    "Bookshelf",
    "Notebook",
    "Pen",
    "Pencil",
    "Eraser",
    "Sharpener",
    "Ruler",
    "Scissors",
    "Stapler",
    "Calculator",
    "Printer",
    "Paperclip",
    "Glue",
    "Paintbrush",
    "Bucket",
    "Mop",
    "Broom",
    "Dustbin",
    "Hanger",
    "Lock",
    "Key",
    "Helmet",
    "Bicycle",
    "Skateboard",
    "Football",
    "Cricket Bat",
    "Tennis Racket",
    "Ball",
    "Frisbee",
    "Guitar",
    "Piano",
    "Drum",
    "Microphone",
    "Ring",
    "Necklace",
    "Bracelet",
    "Earring",
    "Comb",
    "Flashlight",
    "Suitcase",
    "Sewing Machine",
    "Hammer",
    "Screwdriver"
  ],
  "Places": [
    "School",
    "College",
    "University",
    "Hospital",
    "Airport",
    "Railway Station",
    "Bus Stop",
    "Shopping Mall",
    "Supermarket",
    "Restaurant",
    "Cafe",
    "Cinema",
    "Theatre",
    "Library",
    "Museum",
    "Zoo",
    "Aquarium",
    "Park",
    "Playground",
    "Stadium",
    "Gym",
    "Swimming Pool",
    "Beach",
    "Island",
    "Mountain",
    "Forest",
    "Desert",
    "Waterfall",
    "River",
    "Lake",
    "Temple",
    "Church",
    "Mosque",
    "Gurudwara",
    "Palace",
    "Castle",
    "Fort",
    "Hotel",
    "Resort",
    "Hostel",
    "Office",
    "Factory",
    "Bank",
    "ATM",
    "Post Office",
    "Police Station",
    "Fire Station",
    "Court",
    "Prison",
    "Petrol Pump",
    "Parking Lot",
    "Metro Station",
    "Village",
    "City",
    "Town",
    "Farm",
    "Garden",
    "Greenhouse",
    "Bakery",
    "Salon",
    "Spa",
    "Pharmacy",
    "Laboratory",
    "Workshop",
    "Warehouse",
    "Bookstore",
    "Jewellery Shop",
    "Clothing Store",
    "Stadium",
    "Convention Centre",
    "Wedding Hall",
    "Rooftop",
    "Balcony",
    "Basement",
    "Garage",
    "Kitchen",
    "Bedroom",
    "Bathroom",
    "Classroom",
    "Conference Room",
    "Conference Hall",
    "Restaurant Kitchen",
    "Railway Platform",
    "Bus Terminal",
    "Seaport",
    "Lighthouse",
    "Bridge",
    "Tunnel",
    "Highway",
    "Roundabout",
    "Market",
    "Street",
    "Cemetery",
    "Monastery",
    "Observatory",
    "Planetarium",
    "Art Gallery",
    "Amusement Park",
    "Water Park",
    "Camping Site"
  ],
  "Everyday": [
    "Brushing",
    "Bathing",
    "Sleeping",
    "Cooking",
    "Cleaning",
    "Sweeping",
    "Mopping",
    "Washing",
    "Ironing",
    "Folding Clothes",
    "Drinking Water",
    "Eating",
    "Walking",
    "Running",
    "Jogging",
    "Exercising",
    "Dancing",
    "Singing",
    "Reading",
    "Writing",
    "Studying",
    "Typing",
    "Calling",
    "Texting",
    "Gaming",
    "Shopping",
    "Driving",
    "Cycling",
    "Swimming",
    "Travelling",
    "Gardening",
    "Watering Plants",
    "Feeding Pets",
    "Making Tea",
    "Making Coffee",
    "Making Bed",
    "Washing Dishes",
    "Taking Photos",
    "Watching TV",
    "Listening to Music",
    "Opening Door",
    "Closing Window",
    "Locking Door",
    "Unlocking Door",
    "Wearing Shoes",
    "Tying Shoelaces",
    "Combing Hair",
    "Shaving",
    "Applying Perfume",
    "Applying Makeup",
    "Brushing Teeth",
    "Cutting Nails",
    "Packing Bag",
    "Unpacking Bag",
    "Charging Phone",
    "Checking Messages",
    "Setting Alarm",
    "Making Phone Calls",
    "Sending Emails",
    "Attending Meetings",
    "Taking Notes",
    "Printing Documents",
    "Paying Bills",
    "Withdrawing Money",
    "Ordering Food",
    "Booking Tickets",
    "Waiting",
    "Stretching",
    "Meditating",
    "Praying",
    "Laughing",
    "Crying",
    "Sneezing",
    "Coughing",
    "Yawning",
    "Hiccuping",
    "Whistling",
    "Clapping",
    "Waving",
    "Hugging",
    "Shaking Hands",
    "High-Fiving",
    "Knocking",
    "Pointing",
    "Blinking",
    "Chewing",
    "Swallowing",
    "Spitting",
    "Stretching",
    "Scratching",
    "Sweating",
    "Shivering",
    "Hiding",
    "Searching",
    "Organizing",
    "Decorating",
    "Recycling",
    "Taking Out Trash",
    "Feeding Birds",
    "Setting the Table"
  ]
};
const rooms = new Map();
const server = createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true, service: "draw-the-imposter" }));
    return;
  }
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});
const io = new Server(server, {
  cors: { origin: "*" },
  maxHttpBufferSize: 1e5,
  pingInterval: 10000,
  pingTimeout: 20000,
});
const cleanName = (v) =>
  typeof v === "string" && v.trim().length >= 1 && v.trim().length <= 18
    ? v.trim().replace(/[<>]/g, "")
    : null;
function roomView(r) {
  return {
    code: r.code,
    hostId: r.hostId,
    phase: r.phase,
    players: r.players.map(({ id, name, score, connected }) => ({
      id,
      name,
      score,
      connected,
    })),
    round: r.round,
    turnIndex: r.turnIndex,
    turnOrder: r.turnOrder,
    deadline: r.deadline,
    canvas: r.canvas,
    previews: Object.values(r.previews || {}),
    chat: r.chat || [],
    votesOpen: r.phase === "voting",
  };
}
function broadcast(r) {
  io.to(r.code).emit("room:update", roomView(r));
}
function cancel(r) {
  if (r.timer) clearTimeout(r.timer);
  r.timer = null;
}
function phase(r, p, ms) {
  cancel(r);
  r.phase = p;
  if (ms == null) {
    r.deadline = null;
    broadcast(r);
    return;
  }
  r.deadline = Date.now() + ms;
  r.timer = setTimeout(() => {
    if (r.phase !== p) return;
    if (p === "drawing") advance(r);
    else if (p === "discussion") openVoting(r, false);
    else if (p === "voting") finishVote(r);
    else if (p === "revote") finishVote(r);
  }, ms);
  broadcast(r);
}
function privateRoles(r) {
  for (const p of r.players) {
    if (p.id === r.imposterId)
      io.to(p.id).emit("round:role", { imposter: true });
    else
      io.to(p.id).emit("round:role", {
        imposter: false,
        word: r.word,
        category: r.category,
      });
  }
}
function startRound(r) {
  cancel(r);
  r.round++;
  r.phase = "drawing";
  r.wordList = Object.entries(WORDS);
  r.category = r.wordList[randomInt(r.wordList.length)][0];
  r.word = WORDS[r.category][randomInt(WORDS[r.category].length)];
  r.imposterId = r.players[randomInt(r.players.length)].id;
  r.turnOrder = r.players.map((p) => p.id).sort(() => Math.random() - 0.5);
  r.turnIndex = 0;
  r.canvas = [];
  r.votes = {};
  r.revoteIds = null;
  r.chat = [];
  r.strokes = {};
  r.previews = {};
  privateRoles(r);
  phase(r, "drawing", null);
}
function advance(r) {
  cancel(r);
  const currentPlayer = r.turnOrder[r.turnIndex];
  if (currentPlayer && r.previews[currentPlayer]) {
    delete r.previews[currentPlayer];
    io.to(r.code).emit("canvas:preview:clear", { player: currentPlayer });
  }
  r.turnIndex++;
  if (r.turnIndex >= r.turnOrder.length) {
    phase(r, "discussion", DISCUSS_MS);
    return;
  }
  phase(r, "drawing", null);
}
function eligible(r) {
  return r.revoteIds || r.players.map((p) => p.id);
}
function openVoting(r, revote) {
  r.votes = {};
  r.revoteIds = revote ? r.tieIds : null;
  phase(r, revote ? "revote" : "voting", VOTE_MS);
  io.to(r.code).emit("vote:open", {
    candidates: eligible(r)
      .map((id) => {
        const p = r.players.find((x) => x.id === id);
        return p && { id: p.id, name: p.name };
      })
      .filter(Boolean),
    revote,
  });
}
function finishVote(r) {
  cancel(r);
  const tally = {};
  for (const [voter, target] of Object.entries(r.votes))
    if (eligible(r).includes(target)) tally[target] = (tally[target] || 0) + 1;
  const high = Math.max(0, ...Object.values(tally));
  const ties = Object.keys(tally).filter((id) => tally[id] === high);
  if (high > 0 && ties.length > 1 && !r.revoteIds) {
    r.tieIds = ties;
    openVoting(r, true);
    return;
  }
  const caught = high > 0 && ties.length === 1 && ties[0] === r.imposterId;
  const imposter = r.players.find((p) => p.id === r.imposterId);
  const winner = caught ? "players" : "imposter";
  if (caught) {
    for (const p of r.players) if (p.id !== r.imposterId) p.score += 1;
  } else if (imposter) imposter.score += 1;
  r.phase = "results";
  r.deadline = null;
  r.result = {
    word: r.word,
    category: r.category,
    imposterId: r.imposterId,
    imposterName: imposter?.name,
    winner,
    tally: Object.entries(tally).map(([id, count]) => ({
      id,
      name: r.players.find((p) => p.id === id)?.name,
      count,
    })),
    tied: high > 0 && ties.length > 1,
  };
  io.to(r.code).emit("round:results", r.result);
  io.to(r.code).emit("round:role", { results: true, word: r.word });
  broadcast(r);
}
function err(s, msg) {
  s.emit("app:error", { message: msg });
}
io.on("connection", (s) => {
  s.on("room:create", (data = {}) => {
    if (s.data.room)
      return err(s, "Leave the current room before creating another.");
    const name = cleanName(data.name);
    if (!name) return err(s, "Enter a name up to 18 characters.");
    let code;
    do {
      code = randomInt(0x10000).toString(16).padStart(4, "0").toUpperCase();
    } while (rooms.has(code));
    const r = {
      code,
      hostId: s.id,
      phase: "lobby",
      players: [{ id: s.id, name, score: 0, connected: true }],
      canvas: [],
      round: 0,
      turnOrder: [],
      turnIndex: 0,
      deadline: null,
      timer: null,
      chat: [],
      votes: {},
      strokes: {},
      previews: {},
    };
    rooms.set(code, r);
    s.data.room = code;
    s.join(code);
    s.emit("room:joined", roomView(r));
    broadcast(r);
  });
  s.on("room:join", (data = {}) => {
    if (s.data.room)
      return err(s, "Leave the current room before joining another.");
    const r = rooms.get(
      String(data.code || "")
        .trim()
        .toUpperCase(),
    );
    const name = cleanName(data.name);
    if (!r) return err(s, "Room not found. Check the code.");
    if (!name) return err(s, "Enter a name up to 18 characters.");
    if (r.phase !== "lobby") return err(s, "This game has already started.");
    if (r.players.length >= 5)
      return err(s, "Room is full (maximum 5 players).");
    if (r.players.some((p) => p.name.toLowerCase() === name.toLowerCase()))
      return err(s, "That name is already in this room.");
    r.players.push({ id: s.id, name, score: 0, connected: true });
    s.data.room = r.code;
    s.join(r.code);
    s.emit("room:joined", roomView(r));
    broadcast(r);
  });
  s.on("room:reconnect", (data = {}) => {
    const r = rooms.get(String(data.code || "").toUpperCase());
    const p = r?.players.find(
      (x) =>
        x.name.toLowerCase() ===
        String(data.name || "")
          .trim()
          .toLowerCase(),
    );
    if (!r || !p || (p.connected && io.sockets.sockets.has(p.id)))
      return err(
        s,
        "Reconnect unavailable. Use a new name or rejoin the lobby.",
      );
    const oldId = p.id;
    p.connected = true;
    p.id = s.id;
    r.turnOrder = r.turnOrder.map((id) => (id === oldId ? s.id : id));
    if (r.hostId === oldId) r.hostId = s.id;
    if (r.imposterId === oldId) r.imposterId = s.id;
    if (r.result) {
      if (r.result.imposterId === oldId) r.result.imposterId = s.id;
      r.result.tally = r.result.tally.map((v) =>
        v.id === oldId ? { ...v, id: s.id } : v,
      );
    }
    s.data.room = r.code;
    s.join(r.code);
    s.emit("room:joined", roomView(r));
    if (r.phase === "drawing") privateRoles(r);
    if (r.phase === "results") s.emit("round:results", r.result);
    broadcast(r);
  });
  s.on("host:start", () => {
    const r = rooms.get(s.data.room);
    if (!r || r.hostId !== s.id) return err(s, "Only the host can start.");
    if (r.phase !== "lobby" || r.players.length < 4)
      return err(s, "At least four players are required.");
    startRound(r);
  });
  s.on("canvas:preview", (preview) => {
    const r = rooms.get(s.data.room);
    const current = r?.previews?.[s.id];
    if (
      !r ||
      r.phase !== "drawing" ||
      r.turnOrder[r.turnIndex] !== s.id ||
      !preview ||
      typeof preview.id !== "string" ||
      preview.id.length > 80 ||
      !Array.isArray(preview.points) ||
      preview.points.length < 1 ||
      preview.points.length > 100 ||
      !/^#[0-9a-fA-F]{6}$/.test(preview.color) ||
      !["pen", "eraser"].includes(preview.tool)
    )
      return;
    if ((r.strokes[s.id] || 0) >= 3 && !current) return;
    if (current && current.id !== preview.id) return;
    const points = preview.points.map((point) => ({
      x: Number(point.x),
      y: Number(point.y),
    }));
    if (
      points.some(
        ({ x, y }) =>
          !Number.isFinite(x) ||
          !Number.isFinite(y) ||
          x < 0 ||
          x > 1 ||
          y < 0 ||
          y > 1,
      )
    )
      return;
    const valid = {
      id: preview.id,
      player: s.id,
      color: preview.tool === "eraser" ? "#ffffff" : preview.color,
      tool: preview.tool,
      width:
        preview.tool === "eraser"
          ? 18
          : Math.max(2, Math.min(12, Number(preview.width) || 5)),
      points,
    };
    r.previews[s.id] = valid;
    s.to(r.code).emit("canvas:preview", valid);
  });
  s.on("canvas:stroke", (stroke) => {
    const r = rooms.get(s.data.room);
    if (
      !r ||
      r.phase !== "drawing" ||
      r.turnOrder[r.turnIndex] !== s.id ||
      !stroke ||
      !Array.isArray(stroke.points) ||
      stroke.points.length < 1 ||
      stroke.points.length > 100 ||
      !/^#[0-9a-fA-F]{6}$/.test(stroke.color) ||
      !["pen", "eraser"].includes(stroke.tool)
    )
      return;
    const count = r.strokes[s.id] || 0;
    if (count >= 3) return err(s, "Three strokes per turn.");
    const points = stroke.points.slice(0, 100).map((pt) => ({
      x: Math.max(0, Math.min(1, Number(pt.x) || 0)),
      y: Math.max(0, Math.min(1, Number(pt.y) || 0)),
    }));
    const valid = {
      id: randomUUID(),
      player: s.id,
      color: stroke.tool === "eraser" ? "#ffffff" : stroke.color,
      tool: stroke.tool,
      width:
        stroke.tool === "eraser"
          ? 18
          : Math.max(2, Math.min(12, Number(stroke.width) || 5)),
      points,
    };
    r.strokes[s.id] = count + 1;
    r.canvas.push(valid);
    delete r.previews[s.id];
    io.to(r.code).emit("canvas:stroke", valid);
    if (r.canvas.length >= 3 * r.players.length) advance(r);
  });
  s.on("turn:done", () => {
    const r = rooms.get(s.data.room);
    if (r?.phase === "drawing" && r.turnOrder[r.turnIndex] === s.id) {
      delete r.previews[s.id];
      io.to(r.code).emit("canvas:preview:clear", { player: s.id });
      advance(r);
    }
  });
  s.on("canvas:clear-own", () => {
    const r = rooms.get(s.data.room);
    if (!r || r.phase !== "drawing" || r.turnOrder[r.turnIndex] !== s.id)
      return;
    r.canvas = r.canvas.filter((stroke) => stroke.player !== s.id);
    delete r.previews[s.id];
    io.to(r.code).emit("canvas:preview:clear", { player: s.id });
    io.to(r.code).emit("canvas:state", r.canvas);
  });
  s.on("chat:send", (v) => {
    const r = rooms.get(s.data.room);
    const p = r?.players.find((x) => x.id === s.id);
    if (
      !p ||
      !["discussion", "voting", "revote"].includes(r.phase) ||
      typeof v?.text !== "string"
    )
      return;
    const text = v.text.trim().slice(0, 200);
    if (!text) return;
    r.chat.push({ name: p.name, text, at: Date.now() });
    r.chat = r.chat.slice(-60);
    io.to(r.code).emit("chat:message", r.chat.at(-1));
  });
  s.on("vote:submit", (v) => {
    const r = rooms.get(s.data.room);
    const target = typeof v?.target === "string" ? v.target : "";
    if (!r || !["voting", "revote"].includes(r.phase))
      return err(s, "Voting is closed.");
    if (r.votes[s.id]) return err(s, "Your vote is already locked.");
    if (
      !eligible(r).includes(s.id) ||
      target === s.id ||
      !eligible(r).includes(target)
    )
      return err(s, "Choose an eligible player other than yourself.");
    r.votes[s.id] = target;
    s.emit("vote:locked");
    if (
      Object.keys(r.votes).length >=
      eligible(r).filter((id) =>
        r.players.some((p) => p.id === id && p.connected),
      ).length
    )
      finishVote(r);
  });
  s.on("imposter:guess", (v) => {
    const r = rooms.get(s.data.room);
    if (!r || r.phase !== "results" || r.imposterId !== s.id || r.result.guess)
      return;
    const correct =
      String(v?.word || "")
        .trim()
        .toUpperCase() === r.word.toUpperCase();
    r.result.guess = { text: String(v?.word || "").slice(0, 40), correct };
    if (correct) {
      const p = r.players.find((x) => x.id === s.id);
      if (p) p.score += 1;
    }
    io.to(r.code).emit("round:results", r.result);
    broadcast(r);
  });
  s.on("round:again", () => {
    const r = rooms.get(s.data.room);
    if (!r || r.hostId !== s.id || r.phase !== "results")
      return err(s, "Only the host can start the next round.");
    if (r.players.length < 4)
      return err(s, "At least four players are required.");
    startRound(r);
  });
  s.on("disconnect", () => {
    const r = rooms.get(s.data.room);
    if (!r) return;
    if (r.previews?.[s.id]) {
      delete r.previews[s.id];
      io.to(r.code).emit("canvas:preview:clear", { player: s.id });
    }
    const p = r.players.find((x) => x.id === s.id);
    if (p) p.connected = false;
    if (r.hostId === s.id) {
      const next = r.players.find((x) => x.connected && x.id !== s.id);
      if (next) r.hostId = next.id;
    }
    if (r.phase === "lobby") {
      r.players = r.players.filter((x) => x.connected);
      if (r.players.length && !r.players.some((x) => x.id === r.hostId))
        r.hostId = r.players[0].id;
      if (!r.players.length) {
        cancel(r);
        rooms.delete(r.code);
        return;
      }
    }
    broadcast(r);
  });
});
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Draw the Imposter server listening on port ${PORT}`);
  for (const [iface, addrs] of Object.entries(os.networkInterfaces()))
    for (const a of addrs || [])
      if (a.family === "IPv4" && !a.internal)
        console.log(
          `On Wi-Fi (${iface}): http://${a.address}:${PORT} — enter ${a.address}:${PORT} in the app`,
        );
  console.log("Keep this laptop and all phones on the same Wi-Fi network.");
});
