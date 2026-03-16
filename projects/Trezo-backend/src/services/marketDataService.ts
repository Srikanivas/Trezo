import axios from "axios";
import { logger } from "../utils/logger";

export interface AssetPrice {
  id: string;
  symbol: string;
  usdPrice: number;
  change24h: number | null;
}

interface CacheEntry {
  data: AssetPrice[];
  fetchedAt: number;
}

// In-memory cache — 5 minute TTL
const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: CacheEntry | null = null;

// CoinGecko IDs for assets we care about
const COINGECKO_IDS = ["algorand", "usd-coin", "tether"];

export class MarketDataService {
  static async getPrices(): Promise<AssetPrice[]> {
    if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
      return cache.data;
    }

    try {
      const ids = COINGECKO_IDS.join(",");
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
        { timeout: 8000 },
      );

      const raw = response.data;
      const prices: AssetPrice[] = [
        {
          id: "algorand",
          symbol: "ALGO",
          usdPrice: raw["algorand"]?.usd ?? 0,
          change24h: raw["algorand"]?.usd_24h_change ?? null,
        },
        {
          id: "usd-coin",
          symbol: "USDC",
          usdPrice: raw["usd-coin"]?.usd ?? 1,
          change24h: raw["usd-coin"]?.usd_24h_change ?? null,
        },
        {
          id: "tether",
          symbol: "USDT",
          usdPrice: raw["tether"]?.usd ?? 1,
          change24h: raw["tether"]?.usd_24h_change ?? null,
        },
      ];

      cache = { data: prices, fetchedAt: Date.now() };
      logger.info("Market prices refreshed from CoinGecko");
      return prices;
    } catch (err) {
      logger.warn("CoinGecko fetch failed, using fallback prices:", err);
      // Fallback — stale cache or hardcoded defaults
      if (cache) return cache.data;
      return [
        { id: "algorand", symbol: "ALGO", usdPrice: 0.18, change24h: null },
        { id: "usd-coin", symbol: "USDC", usdPrice: 1.0, change24h: null },
        { id: "tether", symbol: "USDT", usdPrice: 1.0, change24h: null },
      ];
    }
  }

  static async getPriceBySymbol(symbol: string): Promise<number> {
    const prices = await this.getPrices();
    return prices.find((p) => p.symbol.toUpperCase() === symbol.toUpperCase())?.usdPrice ?? 0;
  }
}
