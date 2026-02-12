import React, { useEffect, useState } from 'react';
import { cliState } from './state/state';
import { FaWindowClose } from 'react-icons/fa';
import { FaCircle } from 'react-icons/fa6';

export const TimeCounter = ({ customStart, enabled }) => {
  const [seconds, setSeconds] = useState(customStart || 0);

  useEffect(() => {
    if (enabled) {
      setSeconds(customStart || 0);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [enabled]);

  const formatTime = (totalSeconds) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return [hrs, mins, secs].map((n) => String(n).padStart(2, '0')).join(':');
  };

  return (
    <div
      style={{
        fontFamily: 'monospace',
        fontSize: 12,
        letterSpacing: 1,
      }}
    >
      {formatTime(seconds)}
    </div>
  );
};

const StatusBar = ({ id, conn }) => {
  const { removeActiveConnection } = cliState();
  const isConnected = cliState(
    (state) => state.activeConnection[id]?.isConnected ?? false,
  );

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'row',
        alignContent: 'center',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#FFFFFF',
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* <FaWindowClose
          size={30}
          color="red"
          style={{
            marginRight: 20,
            paddingLeft: 4,
            paddingRight: 4,
            cursor: "pointer",
          }}
          onClick={() => removeActiveConnection()}
        /> */}
        <span
          style={{
            color: 'red',
            fontWeight: 'medium',
            fontSize: 14,
            padding: 4,
            cursor: 'pointer',
          }}
          onClick={() => removeActiveConnection(id)}
        >
          Exit
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignContent: 'center',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <FaCircle
          size={10}
          color={isConnected ? 'green' : 'red'}
          style={{ verticalAlign: 'middle' }}
        />
        <span
          style={{
            margin: 0,
            fontFamily: 'monospace',
            lineHeight: '1',
            fontSize: 14,
          }}
        >
          {conn.hostname ?? 'Host'}({conn.ip ?? 'IP'})
        </span>
      </div>
      <TimeCounter enabled={isConnected} />
    </div>
  );
};

export default StatusBar;
