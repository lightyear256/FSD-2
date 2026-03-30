import { app } from "./index.js";
import { createServer } from "http";
import { initSocket } from "./socket.js";

const server = createServer(app);

initSocket(server);

server.listen(5000, () => {
  console.log("Server listening on port 5000");
});