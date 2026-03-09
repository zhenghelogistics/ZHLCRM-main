/**
 * A client-side, defensive parser for extracting quote information from raw email text.
 * No external libraries or AI calls are used.
 */

// --- TYPES ---

export interface ParsedQuote {
    mode: 'Sea' | 'Air' | 'Unknown';
    liner?: string;
    contract_ref?: string;
    free_days?: string;
    container_rates?: Record<string, number>;
    total_price: number;
    industry?: string;
    notes?: string;
    raw_excerpt: string;
    confidence: number;
}

// --- MAIN PARSER FUNCTION ---

export function parseQuoteEmail(rawText: string): ParsedQuote {
    const result: ParsedQuote = {
        raw_excerpt: rawText.substring(0, 500),
        confidence: 0,
        mode: 'Unknown',
        container_rates: {},
        total_price: 0,
    };

    try {
        const lowerText = rawText.toLowerCase();

        // --- Mode ---
        if (lowerText.includes('by sea') || lowerText.includes('ocean freight')) {
            result.mode = 'Sea';
            result.confidence += 15;
        } else if (lowerText.includes('by air') || lowerText.includes('air freight')) {
            result.mode = 'Air';
             result.confidence += 15;
        }

        // --- Liner ---
        const linerMatch = rawText.match(/Liner\s*:\s*([A-Z\s]+)/i) || rawText.match(/(EVERGREEN|MAERSK|CMA CGM|MSC|ONE|HAPAG-LLOYD)/i);
        if (linerMatch && linerMatch[0]) {
            result.liner = linerMatch[0].replace(/Liner\s*:\s*/i, '').trim();
            result.confidence += 15;
        }
        
        // --- Contract Ref ---
        const contractMatch = rawText.match(/(Contract Ref|Contract No)\s*:\s*([\w\d-]+)/i);
        if (contractMatch && contractMatch[2]) {
            result.contract_ref = contractMatch[2].trim();
             result.confidence += 10;
        }
        
        // --- Free Days ---
        const freeDaysMatch = rawText.match(/(\d+)\s*days\s*(?:DET|DEM|free time)/i);
        if (freeDaysMatch && freeDaysMatch[1]){
            result.free_days = `${freeDaysMatch[1]} days`;
            result.confidence += 10;
        }

        // --- Pricing Logic ---
        // Priority 1: Look for an explicit TOTAL line.
        const totalMatch = rawText.match(/TOTAL:\s*(?:USD\s*)?\$?([\d,]+\.?\d*)/i);
        if (totalMatch && totalMatch[1]) {
            const totalPrice = parseFloat(totalMatch[1].replace(/,/g, ''));
            if (!isNaN(totalPrice)) {
                result.total_price = totalPrice;
                result.confidence += 60; // High confidence for explicit total
            }
        }

        // Priority 2: If no total, sum up all USD amounts found.
        if (result.total_price === 0) {
            const lines = rawText.split('\n');
            let calculatedSum = 0;
            let pricesFound = false;

            for (const line of lines) {
                if (line.toLowerCase().includes('ex rate')) continue;

                // Match formats like "USD 105.84" or "(USD 155)"
                const usdMatch = line.match(/(?:USD|\$)\s*([\d,]+\.?\d*)/i) || line.match(/\(USD\s*([\d,]+\.?\d*)\)/i);
                
                if (usdMatch && usdMatch[1]) {
                    const value = parseFloat(usdMatch[1].replace(/,/g, ''));
                    if (!isNaN(value)) {
                        calculatedSum += value;
                        pricesFound = true;
                    }
                }
            }
            
            if (pricesFound) {
                result.total_price = Math.round(calculatedSum * 100) / 100; // Round to 2 decimal places
                result.confidence += 40;
            }
        }
        
        // --- Industry Inference ---
        const industryKeywords: { [key: string]: RegExp } = {
            'Tech': /server|computing|software|hardware|electronics/i,
            'Pharmaceuticals': /pharma|medical|clinical|vaccine|biotech/i,
            'Manufacturing': /textiles|polyester|machinery|parts|industrial|factory/i,
            'Commodities': /foods|agri|coconut|palm oil|grain|timber|minerals/i,
            'Retail': /retail|imports|exports|garments|consumer goods/i,
        };

        for (const [industry, regex] of Object.entries(industryKeywords)) {
            if (regex.test(lowerText)) {
                result.industry = industry;
                result.confidence += 10;
                break;
            }
        }

        // --- Notes ---
        const notesMatch = rawText.match(/Subject to[\s\S]*/i) || rawText.match(/Terms & Conditions[\s\S]*/i) || rawText.match(/Note:[\s\S]*/i);
        if (notesMatch) {
            result.notes = notesMatch[0].trim();
        }

        result.confidence = Math.min(result.confidence, 100);

    } catch (error) {
        console.error("Defensive catch in email parser:", error);
        // Return a default object so the app doesn't crash
         return {
            raw_excerpt: rawText.substring(0, 500),
            confidence: 0,
            mode: 'Unknown',
            total_price: 0,
        };
    }

    return result;
}
