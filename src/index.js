// src/index.js
import express from "express";
import clientesRoutes from "./routers/clientes.routes.js";
import empleadosRoutes from "./routers/empleados.routes.js";
import actividadesRoutes from "./routers/actividades.routes.js";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api", clientesRoutes);
app.use("/api", empleadosRoutes);
app.use("/api", actividadesRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("listening on port:", PORT);
});
