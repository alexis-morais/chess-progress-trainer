import { useEffect, useRef, useState } from 'react';
import { ComputerEngine, isAbort } from '../computer/ComputerEngine';
import type { EngineStatus, PositionAnalysis } from '../computer/types';
import type { Side } from '../data/openings';
import { LAB_EVALUATION_SETTINGS, LAB_RECOMMENDATION_SETTINGS } from './model';

export type LabAnalysisState = {
  status: EngineStatus;
  result: PositionAnalysis | null;
  recommendationsVisible: boolean;
  positionKey: string | null;
};

export function useOpeningLabAnalysis({
  fen,
  history,
  studiedSide,
  active,
}: {
  fen: string;
  history: string[];
  studiedSide: Side;
  active: boolean;
}): LabAnalysisState {
  const [state, setState] = useState<LabAnalysisState>({
    status: 'loading',
    result: null,
    recommendationsVisible: false,
    positionKey: null,
  });
  const engine = useRef<ComputerEngine | null>(null);
  const generation = useRef(0);
  const cache = useRef(new Map<string, PositionAnalysis>());
  const turn = fen.split(' ')[1] as Side;
  const recommendationsVisible = turn === studiedSide;
  const settings = recommendationsVisible ? LAB_RECOMMENDATION_SETTINGS : LAB_EVALUATION_SETTINGS;
  const positionKey = active ? `${fen}|${settings.multiPV}` : null;

  useEffect(() => {
    const instance = new ComputerEngine((status) =>
      setState((current) => ({ ...current, status })),
    );
    engine.current = instance;
    return () => {
      generation.current += 1;
      instance.dispose();
      engine.current = null;
    };
  }, []);

  useEffect(() => {
    const id = ++generation.current;
    if (!active) {
      setState((current) => ({
        ...current,
        result: null,
        recommendationsVisible: false,
        positionKey: null,
      }));
      return;
    }
    const cached = cache.current.get(positionKey!);
    if (cached) {
      setState({ status: 'ready', result: cached, recommendationsVisible, positionKey });
      return;
    }
    const controller = new AbortController();
    setState((current) => ({
      status: current.status === 'unavailable' ? 'unavailable' : 'thinking',
      result: null,
      recommendationsVisible,
      positionKey,
    }));
    engine.current
      ?.search({ fen, history }, settings, controller.signal)
      .then((result) => {
        if (controller.signal.aborted || generation.current !== id) return;
        cache.current.set(positionKey!, result);
        setState({ status: 'ready', result, recommendationsVisible, positionKey });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || generation.current !== id || isAbort(error)) return;
        setState({
          status: 'unavailable',
          result: null,
          recommendationsVisible: false,
          positionKey,
        });
      });
    return () => controller.abort();
  }, [active, fen, history, positionKey, recommendationsVisible, settings]);

  // Effects run after render. The key check prevents even one paint with arrows from an old FEN.
  return state.positionKey === positionKey
    ? state
    : {
        status: state.status === 'unavailable' ? 'unavailable' : 'thinking',
        result: null,
        recommendationsVisible: active && recommendationsVisible,
        positionKey,
      };
}
