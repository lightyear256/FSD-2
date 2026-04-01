import { app } from "./index.js";
import { createServer } from "http";
import { initSocket } from "./socket.js";
import { ExpressPeerServer } from "peer";
import twilio from "twilio";

const server = createServer(app);

const peerServer = ExpressPeerServer(server, {
  path: "/",
});
app.use("/peerjs", peerServer);

peerServer.on("connection", (client) => {
  console.log("PeerJS client connected:", client.getId());
});
peerServer.on("disconnect", (client) => {
  console.log("PeerJS client disconnected:", client.getId());
});

app.get("/api/turn", async(req, res) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    return res.status(500).json({ error: "Twilio credentials missing" });
  }

  try {
    const client = twilio(accountSid, authToken);
    const token = await client.tokens.create();
    res.json({ iceServers: token.iceServers });
  } catch (error) {
    console.error("Twilio error:", error);
    res.status(500).json({ error: "Failed to generate turn credentials" });
  }
});

initSocket(server);

server.listen(5000,"0.0.0.0", () => {
  console.log("Server listening on port 5000");
});