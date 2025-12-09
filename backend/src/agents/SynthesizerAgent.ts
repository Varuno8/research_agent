import { NewsResult } from './NewsAgent';
import { TechnicalResult } from './TechnicalAgent';
import { FundamentalResult } from './FundamentalAgent';

export class SynthesizerAgent {
    compose(
        sector: string,
        news: NewsResult,
        technicals: TechnicalResult[],
        fundamentals: FundamentalResult[]
    ): string {

        // Combine technicals and fundamentals into a table
        let table = "| Company | Price | Market Cap | P/E | 1y Return |\n|---|---:|---:|---:|---:|\n";

        // We assume technicals and fundamentals are aligned by index or we map them
        // For simplicity, we'll iterate through technicals and find matching fundamental

        for (const tech of technicals) {
            const fund = fundamentals.find(f => f.ticker === tech.ticker);
            const mc = fund?.market_cap ? (fund.market_cap / 1e9).toFixed(2) + "B" : "N/A";
            const pe = fund?.pe_ratio ? fund.pe_ratio.toFixed(2) : "N/A";
            const ret = tech.change1y ? (tech.change1y * 100).toFixed(2) + "%" : "N/A";

            table += `| ${tech.ticker} | ${tech.price?.toFixed(2) || "N/A"} | ${mc} | ${pe} | ${ret} |\n`;
        }

        const sourcesMd = news.sources.map(r => `- [${r.title}](${r.url})`).join("\n");

        return `# ${sector} Sector — Deep Research Report

## 1. Executive Summary
${news.summary}

## 2. Market Data & Valuation
${table}

## 3. Analyst Thesis
Based on the multi-agent analysis:
- **Technicals**: ${technicals.filter(t => (t.change1y || 0) > 0).length} out of ${technicals.length} companies are positive over the last year.
- **Fundamentals**: Average P/E ratio suggests ${this.getValuationComment(fundamentals)}.

## 4. Sources
${sourcesMd}
`;
    }

    private getValuationComment(fundamentals: FundamentalResult[]): string {
        const validPEs = fundamentals.map(f => f.pe_ratio).filter(p => p !== null) as number[];
        if (validPEs.length === 0) return "insufficient data";
        const avgPE = validPEs.reduce((a, b) => a + b, 0) / validPEs.length;
        if (avgPE > 30) return "high growth expectations (Premium Valuation)";
        if (avgPE < 15) return "potential undervaluation (Value Territory)";
        return "fair valuation aligned with historical averages";
    }
}
