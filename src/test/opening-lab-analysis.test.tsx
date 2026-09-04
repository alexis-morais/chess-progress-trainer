import { act, render, screen, waitFor } from '@testing-library/react';
import { Chess } from 'chess.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useOpeningLabAnalysis } from '../opening-lab/useOpeningLabAnalysis';

class ControlledWorker {
  static instance: ControlledWorker;
  onmessage: Worker['onmessage'] = null;
  onerror: Worker['onerror'] = null;
  onmessageerror: Worker['onmessageerror'] = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() {
    ControlledWorker.instance = this;
  }
  emit(data: string) {
    this.onmessage?.call(this as unknown as Worker, { data } as MessageEvent);
  }
  boot() {
    this.emit(
      'option name Skill Level type spin default 20 min 0 max 20\noption name MultiPV type spin default 1 min 1 max 256\noption name UCI_LimitStrength type check default false\noption name UCI_Elo type spin default 1320 min 1320 max 3190\nuciok\nreadyok',
    );
  }
}

function Harness({ fen, history }: { fen: string; history: string[] }) {
  const analysis = useOpeningLabAnalysis({ fen, history, studiedSide: 'w', active: true });
  return (
    <div>
      <span data-testid="analysis-status">{analysis.status}</span>
      <span data-testid="analysis-score">
        {analysis.result && 'cp' in analysis.result.score ? analysis.result.score.cp : 'aucun'}
      </span>
    </div>
  );
}

beforeEach(() => vi.stubGlobal('Worker', ControlledWorker));

describe('Ouverture libre : invalidation des analyses', () => {
  it('ignore une ancienne réponse après changement de FEN, navigation et reset', async () => {
    const start = new Chess();
    const afterE4 = new Chess();
    afterE4.move('e4');
    const view = render(<Harness fen={start.fen()} history={[]} />);
    const worker = ControlledWorker.instance;
    act(() => worker.boot());
    act(() => worker.emit('readyok'));
    expect(worker.postMessage).toHaveBeenCalledWith(expect.stringMatching(/^go /));

    view.rerender(<Harness fen={afterE4.fen()} history={['e2e4']} />);
    expect(screen.getByTestId('analysis-score')).toHaveTextContent('aucun');
    expect(worker.postMessage).toHaveBeenCalledWith('stop');
    act(() => worker.emit('info depth 13 multipv 1 score cp 9999 pv e2e4\nbestmove e2e4'));
    act(() => worker.emit('readyok'));
    act(() => worker.emit('info depth 11 score cp 35 pv e7e5\nbestmove e7e5'));
    await waitFor(() => expect(screen.getByTestId('analysis-score')).toHaveTextContent('-35'));

    view.rerender(<Harness fen={start.fen()} history={[]} />);
    await waitFor(() => expect(screen.getByTestId('analysis-score')).toHaveTextContent('aucun'));
    act(() => worker.emit('info depth 11 score cp -7777 pv e7e5\nbestmove e7e5'));
    expect(screen.getByTestId('analysis-score')).not.toHaveTextContent('-7777');
    act(() => worker.emit('readyok'));
    act(() =>
      worker.emit(
        'info depth 13 multipv 1 score cp 28 pv e2e4\ninfo depth 13 multipv 2 score cp 20 pv d2d4\ninfo depth 13 multipv 3 score cp 14 pv g1f3\nbestmove e2e4',
      ),
    );
    await waitFor(() => expect(screen.getByTestId('analysis-score')).toHaveTextContent('28'));
  });
});
