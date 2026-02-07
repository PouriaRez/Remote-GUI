import { create } from 'zustand';

const cliState = create((set) => ({
  activeConnection: null,
  setActiveConnection: (conn) => set({ activeConnection: conn }),
  removeActiveConnection: () => set({ activeConnection: null }),
  isConnected: false,
  setIsConnected: (state) => set({ isConnected: state }),

}));

export default cliState;