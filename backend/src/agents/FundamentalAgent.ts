import yahooFinance from 'yahoo-finance2';

export interface FundamentalResult {
    ticker: string;
    market_cap: number | null;
    pe_ratio: number | null;
    eps: number | null;
    sector: string | null;
}

export class FundamentalAgent {
    async analyze(ticker: string): Promise<FundamentalResult> {
        try {
            const quote = await yahooFinance.quote(ticker) as any;
            return {
                ticker,
                market_cap: quote.marketCap || null,
                pe_ratio: quote.trailingPE || null,
                eps: quote.epsTrailingTwelveMonths || null,
                sector: quote.sector || null // e.g. "Technology"
            };
        } catch (error) {
            console.error(`Fundamental analysis failed for ${ticker}`, error);
            return { ticker, market_cap: null, pe_ratio: null, eps: null, sector: null };
        }
    }
}
