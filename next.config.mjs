const nextConfig = {
  reactStrictMode: true,
  // Permet le build sur le VPS sans devDependencies (eslint/vitest).
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false },
  // Ne pas utiliser output: "standalone" : avec "next start" les assets CSS/JS
  // ne sont pas servis correctement sur le VPS (page sans style).
};
export default nextConfig;
