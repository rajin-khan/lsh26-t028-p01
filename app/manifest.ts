import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KajChole",
    short_name: "KajChole",
    description: "A load-shedding work planner for grid, generator, and no-power jobs.",
    start_url: "/",
    display: "standalone",
    background_color: "#11140f",
    theme_color: "#c8eb55",
  };
}
