import yahooFinance from 'yahoo-finance2';

export interface TechnicalResult {
    ticker: string;
    price: number | null;
    history: { date: string; price: number }[];
    change1y: number | null;
}

export class TechnicalAgent {
    async analyze(ticker: string): Promise<TechnicalResult> {
        try {
            const quote = await yahooFinance.quote(ticker) as any;
            const price = quote.regularMarketPrice || null;

            let historyData: { date: string; price: number }[] = [];
            let change1y: number | null = null;

            try {
                const endDate = new Date();
                const startDate = new Date();
                startDate.setFullYear(startDate.getFullYear() - 1);

                const history = await yahooFinance.historical(ticker, {
                    period1: startDate,
                    period2: endDate,
                    interval: '1d'
                }) as any[];

                if (history.length > 0) {
                    const startPrice = history[0].close;
                    const endPrice = history[history.length - 1].close;
                    change1y = (endPrice / startPrice) - 1;

                    historyData = history.map(h => ({
                        date: h.date.toISOString().split('T')[0],
                        price: h.close
                    }));
                }
            } catch (e) {
                console.error(`Failed to get history for ${ticker}`, e);
            }

            return {
                ticker,
                price,
                history: historyData,
                change1y
            };

        } catch (error) {
            console.error(`Technical analysis failed for ${ticker}`, error);
            return { ticker, price: null, history: [], change1y: null };
        }
    }
}
