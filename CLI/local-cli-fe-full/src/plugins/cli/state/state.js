import { create } from 'zustand';

export const cliState = create((set) => ({
  activeConnection: {},
  setActiveConnection: (id, conn) =>
    set((state) => ({
      activeConnection: {
        ...state.activeConnection,
        [id]: conn,
      },
    })),

  removeActiveConnection: (id) =>
    set((state) => {
      const updatedConnections = { ...state.activeConnection };
      delete updatedConnections[id];
      return { activeConnection: updatedConnections };
    }),
  setIsConnected: (id, connState) =>
    set((state) => {
      const connection = state.activeConnection[id];
      if (!connection) return state;

      return {
        activeConnection: {
          ...state.activeConnection,
          [id]: { ...connection, isConnected: connState },
        },
      };
    }),
}));
