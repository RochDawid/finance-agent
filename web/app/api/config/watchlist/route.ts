import { NextResponse } from "next/server";
import { loadConfig, findConfigPath } from "@finance/config.js";
import { writeFileSync } from "node:fs";
import { stringify } from "yaml";

export async function PATCH(request: Request) {
  try {
    const body = await request.json() as {
      action: "add" | "remove";
      ticker: string;
      type: "stocks" | "crypto";
    };

    const config = loadConfig();
    const list = config.watchlist[body.type];

    if (body.action === "add") {
      if (!list.includes(body.ticker)) {
        list.push(body.ticker);
      }
    } else if (body.action === "remove") {
      const idx = list.indexOf(body.ticker);
      if (idx !== -1) {
        list.splice(idx, 1);
      }
    }

    writeFileSync(findConfigPath(), stringify(config), "utf-8");

    return NextResponse.json({ watchlist: config.watchlist });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
