import { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import cliState from "./state/state";

const TerminalView = ({ host, user, credential, action, authType }) => {
  const terminalRef = useRef(null);
  const termRef = useRef(null);
  const wsRef = useRef(null);
  const fitRef = useRef(null);

  const { isConnected, setIsConnected } = cliState();

  useEffect(() => {
    const wsStatusCheck = setInterval(() => {
      const isOpen = wsRef.current?.readyState === WebSocket.OPEN;
      setIsConnected(isOpen);
    }, 1000);

    return () => clearInterval(wsStatusCheck);
  }, []);

  useEffect(() => {
    console.log("isConnected:", isConnected);
  }, [isConnected]);

  useEffect(() => {
    if ((!host || !user || !credential || !action, !authType)) return;
    if (termRef.current) return;

    const run = async () => {
      console.log(`Connecting to host ${host} through ${action} with ${authType}`);

      const term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      });
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      fitRef.current = fitAddon;

      termRef.current = term;

      term.open(terminalRef.current);

      const fitTerminal = () => {
        if (!terminalRef.current) return;

        const rect = terminalRef.current.getBoundingClientRect();
        console.log("Terminal container rect:", rect.width, rect.height);

        if (rect.width > 0 && rect.height > 0) {
          fitAddon.fit();
        }
      };

      // Fit after terminal is opened
      setTimeout(fitTerminal, 100);

      const writeErr = (msg) => {
        term.writeln("");
        term.write(msg);
        term.scrollToBottom();
      };

      let conn_method = {};
      if (authType === "password") {
        conn_method = {
          method: "password",
          data: credential,
        };
      } else {
        conn_method = {
          method: "key-string",
          data: credential,
        };
      }

      const ws = new WebSocket("ws://localhost:8000/cli/ws");
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("Sending: ", host, conn_method.method);
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
        } else {
          console.log(`Disconnected. Session ended`);
        }
      };

      term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ action: "client_input", input: data }));
        }
      });

      term.onResize(({ cols, rows }) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              action: "resize",
              cols: cols,
              rows: rows,
            }),
          );
        }
      });

      const handleWindowResize = () => {
        fitTerminal();
      };

      window.addEventListener("resize", handleWindowResize);

      return () => {
        window.removeEventListener("resize", handleWindowResize);
        term.dispose();
        ws.close();
        termRef.current = null;
        wsRef.current = null;
      };
    };

    run();
  }, [host, user, credential, action]);

  return (
    <>
      <div
        id="terminal-overall-div"
        ref={terminalRef}
        style={{
          height: "100%",
          width: "1600px",
          boxSizing: "border-box",
        }}
      />
    </>
  );
};

export default TerminalView;
