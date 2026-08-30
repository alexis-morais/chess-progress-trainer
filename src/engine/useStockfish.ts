import { useEffect, useRef, useState } from 'react';
import { StockfishEngine, type AnalysisState } from './StockfishEngine';

export function useStockfish(fen: string) {
  const [analysis, setAnalysis] = useState<AnalysisState>({ status: 'loading', evaluation: null });
  const engine = useRef<StockfishEngine | null>(null);
  useEffect(() => {
    const instance = new StockfishEngine(setAnalysis);
    engine.current = instance;
    return () => {
      instance.dispose();
      engine.current = null;
    };
  }, []);
  useEffect(() => {
    engine.current?.analyze(fen);
  }, [fen]);
  return analysis;
}
