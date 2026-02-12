import { create } from 'zustand';

// Transform these states to objs w id's

const cliState = create((set) => ({
  activeConnection: null,
  setActiveConnection: (conn) => set({ activeConnection: conn }),
  removeActiveConnection: () => set({ activeConnection: null }),
  isConnected: false,
  setIsConnected: (state) => set({ isConnected: state }),
}));

export const cliStateRefactor = create((set) => ({
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
  setIsConnectedRe: (id, connState) =>
    set((state) => {
      const connection = state.activeConnection[id];
      // Connection existence check
      if (!connection) return state;

      return {
        activeConnection: {
          ...state.activeConnection,
          [id]: { ...connection, isConnected: connState },
        },
      };
    }),
}));

export default cliState;
