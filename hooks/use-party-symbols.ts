import { useMemo } from 'react';
import { useJsonData } from './use-json-data';

interface PartySymbol {
  party_name_en: string;
  party_name_np: string;
  symbol_url: string | null;
  symbol_alt: string | null;
  [key: string]: any;
}

export function usePartySymbols() {
  const { data: symbols } = useJsonData<PartySymbol>('political_party_symbols');

  // Create a map of party names to symbol URLs for quick lookup
  const symbolMap = useMemo(() => {
    if (!symbols) return new Map();

    const map = new Map<string, string | null>();
    symbols.forEach((symbol) => {
      if (symbol.party_name_en) {
        map.set(symbol.party_name_en, symbol.symbol_url);
      }
      if (symbol.party_name_np) {
        map.set(symbol.party_name_np, symbol.symbol_url);
      }
    });
    return map;
  }, [symbols]);

  const getSymbolUrl = (partyName: string): string | null => {
    return symbolMap.get(partyName) || null;
  };

  return { symbols, symbolMap, getSymbolUrl };
}
