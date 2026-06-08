import type { NextConfig } from "next";

// Cambia REPO_NAME por el nombre exacto de tu repositorio en GitHub.
// Si el repo se llama "atlas-cronologico" la URL será tuusuario.github.io/atlas-cronologico
// Si usas dominio propio o repo usuario.github.io, deja basePath en ''
const REPO_NAME = "Timeline";

const nextConfig: NextConfig = {
  output: "export",           // genera carpeta out/ con HTML estático
  basePath: `/${REPO_NAME}`,  // prefijo necesario para github.io/REPO_NAME
  images: {
    unoptimized: true,        // obligatorio en export estático
  },
};

export default nextConfig;
