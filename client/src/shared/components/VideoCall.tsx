import { JitsiMeeting } from '@jitsi/react-sdk';

interface VideoCallProps {
  roomName: string;
  displayName: string;
  onReadyToClose?: () => void;
}

export function VideoCall({ roomName, displayName, onReadyToClose }: VideoCallProps) {
  const domain = (import.meta as any).env.VITE_JITSI_DOMAIN || 'meet.jit.si';

  return (
    <div className="h-full w-full">
      <JitsiMeeting
        domain={domain}
        roomName={roomName}
        configOverwrite={{
          startWithAudioMuted: false,
          disableModeratorIndicator: true,
          startWithVideoMuted: false,
          enableEmailInStats: false,
          prejoinPageEnabled: false,
        }}
        interfaceConfigOverwrite={{
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        }}
        userInfo={{
          displayName: displayName,
          email: '',
        }}
        onReadyToClose={onReadyToClose}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = '100%';
          iframeRef.style.width = '100%';
        }}
      />
    </div>
  );
}
