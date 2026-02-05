import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

const TerminalView = ({ host, user, password, action }) => {
  const terminalRef = useRef(null);
  const termRef = useRef(null);
  const wsRef = useRef(null);
  const fitRef = useRef(null);

  useEffect(() => {
    if (!host || !user || !password || !action) return;
    if (termRef.current) return;

    const run = async () => {
      console.log(`Connecting to host ${host} through ${action}`);

      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      });

      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      fitRef.current = fitAddon;

      requestAnimationFrame(() => {
        term.open(terminalRef.current);
        fitAddon.fit();
      });

      termRef.current = term;

      const writeErr = (msg) => {
        term.writeln('');
        term.write(msg);
        term.scrollToBottom();
      };

      /*
      
      */
      const ws = new WebSocket('ws://localhost:8000/cli/ws');
      wsRef.current = ws;

      /*
      method: password | key-string | key-file
      data: 'password' | 'private key string' | '\path\to\private_key' 
      */
      // remove this after frontend is done.... created for testing.
      const conn_method = {
        method: 'key-file',
        data: `\\\\wsl.localhost\\Ubuntu-24.04\\home\\pouria\\.ssh\\id_ed25519`,
      };
      ws.onopen = () => {
        console.log('Sending: ', host, conn_method);
        ws.send(
          JSON.stringify({
            action: action,
            host: host,
            user: user,
            conn_method: conn_method,
            cols: term.cols,
            rows: term.rows,
          }),
        );
      };
      ws.onmessage = (e) => {
        term.write(e.data);
        term.scrollToBottom();
      };
      ws.onerror = (e) => {
        console.log(e);
        writeErr(`WebSocket error: Disconnected`);
      };
      ws.onclose = (e) => {
        if (!e.wasClean) {
          console.log(`Unexpected websocket interruption: `, e);
          // writeErr(`Unexpected websocket interruption`);
        } else {
          console.log(`Disconnected. Session ended`);
          // writeErr(`Disconnected. Session ended.`);
        }
      };

      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: 'client_input', input: data }));
        }
      });

      term.onResize(({ cols, rows }) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              action: 'resize',
              cols: cols,
              rows: rows,
            }),
          );
        }
      });

      const handleDimChange = () => {
        fitAddon.fit();
      };
      window.addEventListener('resize', handleDimChange);

      return () => {
        window.removeEventListener('resize', handleDimChange);
        term.dispose();
        ws.close();
        termRef.current = null;
        wsRef.current = null;
      };
    };
    run();
  }, [host, user, password, action]);

  return (
    <>
      <div
        id="terminal-overall-div"
        ref={terminalRef}
        style={{
          height: '100%',
          width: '100%',
        }}
      />
    </>
  );
};

export default TerminalView;
