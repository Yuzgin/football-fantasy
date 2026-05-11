import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import Admin from './Admin';
import api from '../api';

vi.mock('../components/ViewPlayerList', () => ({
  default: function MockViewPlayerList() {
    return <div data-testid="mock-view-player-list" />;
  },
}));

vi.mock('../components/CreatePlayerForm', () => ({
  default: function MockCreatePlayerForm() {
    return <div data-testid="mock-create-player-form" />;
  },
}));

vi.mock('../components/MatchList', () => ({
  default: function MockMatchList() {
    return <div data-testid="mock-match-list" />;
  },
}));

vi.mock('../components/CreateMatchForm', () => ({
  default: function MockCreateMatchForm() {
    return <div data-testid="mock-create-match-form" />;
  },
}));

vi.mock('../api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
    interceptors: {
      request: { use: vi.fn(), eject: vi.fn(), handlers: [] },
    },
  },
}));

function mockInitialFetches() {
  vi.mocked(api.get).mockImplementation((url) => {
    if (url === '/api/players/') return Promise.resolve({ data: [] });
    if (url === '/api/matches/') return Promise.resolve({ data: [] });
    if (url === '/api/player-game-stats/') return Promise.resolve({ data: [] });
    return Promise.reject(new Error(`Unexpected GET ${url}`));
  });
}

describe('Admin snapshot backfill (header button)', () => {
  beforeEach(() => {
    mockInitialFetches();
    vi.mocked(api.post).mockReset();
  });

  it('calls preview then backfill when teams are missing snapshots and user confirms', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    vi.mocked(api.get).mockImplementation((url) => {
      if (url === '/api/players/') return Promise.resolve({ data: [] });
      if (url === '/api/matches/') return Promise.resolve({ data: [] });
      if (url === '/api/player-game-stats/') return Promise.resolve({ data: [] });
      if (url === '/api/staff/missing-snapshots/preview/') {
        return Promise.resolve({
          data: {
            game_week: 4,
            affected_teams: [
              { team_id: 1, team_name: 'Alpha', user_email: 'a@example.com' },
            ],
          },
        });
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    vi.mocked(api.post).mockResolvedValue({
      data: { created_count: 1, game_week: 4 },
    });

    render(<Admin />);

    const btn = await screen.findByRole('button', {
      name: /backfill missing snapshots/i,
    });
    await user.click(btn);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/staff/missing-snapshots/preview/');
    });
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/staff/missing-snapshots/backfill/');
    });

    expect(confirmSpy).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalled();

    confirmSpy.mockRestore();
    alertSpy.mockRestore();
  });

  it('does not POST backfill when preview reports no affected teams', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    vi.mocked(api.get).mockImplementation((url) => {
      if (url === '/api/players/') return Promise.resolve({ data: [] });
      if (url === '/api/matches/') return Promise.resolve({ data: [] });
      if (url === '/api/player-game-stats/') return Promise.resolve({ data: [] });
      if (url === '/api/staff/missing-snapshots/preview/') {
        return Promise.resolve({
          data: { game_week: 4, affected_teams: [] },
        });
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    render(<Admin />);

    const btn = await screen.findByRole('button', {
      name: /backfill missing snapshots/i,
    });
    await user.click(btn);

    await waitFor(() => {
      expect(api.post).not.toHaveBeenCalled();
    });
    expect(alertSpy).toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('surfaces API error detail from preview (e.g. no current gameweek in deployment DB)', async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    vi.mocked(api.get).mockImplementation((url) => {
      if (url === '/api/players/') return Promise.resolve({ data: [] });
      if (url === '/api/matches/') return Promise.resolve({ data: [] });
      if (url === '/api/player-game-stats/') return Promise.resolve({ data: [] });
      if (url === '/api/staff/missing-snapshots/preview/') {
        return Promise.reject({
          response: { data: { detail: 'No current GameWeek found.' } },
        });
      }
      return Promise.reject(new Error(`Unexpected GET ${url}`));
    });

    render(<Admin />);

    const btn = await screen.findByRole('button', {
      name: /backfill missing snapshots/i,
    });
    await user.click(btn);

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('No current GameWeek found.');
    });

    alertSpy.mockRestore();
  });

  it('runs the create/update team snapshots command from the header button', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    vi.mocked(api.post).mockResolvedValue({
      data: { output: 'All team snapshots have been processed successfully.' },
    });

    render(<Admin />);

    const btn = await screen.findByRole('button', {
      name: /create\/update team snapshots/i,
    });
    await user.click(btn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/staff/team-snapshots/create-or-update/');
    });
    expect(confirmSpy).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('All team snapshots have been processed successfully.');

    confirmSpy.mockRestore();
    alertSpy.mockRestore();
  });
});
