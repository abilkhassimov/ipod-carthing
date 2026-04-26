const { execSync } = require("child_process");

function run(script) {
  try {
    return execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`, {
      timeout: 5000,
    })
      .toString()
      .trim();
  } catch (e) {
    return null;
  }
}

function runMultiline(script) {
  const tmpFile = `/tmp/bridge_${Date.now()}.scpt`;
  require("fs").writeFileSync(tmpFile, script);
  try {
    const result = execSync(`osascript ${tmpFile}`, { timeout: 10000 })
      .toString()
      .trim();
    require("fs").unlinkSync(tmpFile);
    return result;
  } catch (e) {
    try { require("fs").unlinkSync(tmpFile); } catch {}
    return null;
  }
}

const AS = {
  getCurrentTrack() {
    const result = runMultiline(`
tell application "Music"
  if player state is stopped then return "STOPPED"
  set t to current track
  set trackName to name of t
  set trackArtist to artist of t
  set trackAlbum to album of t
  set trackDuration to duration of t
  set trackPosition to player position
  set trackState to player state as string
  set persistID to persistent ID of t
  return trackName & "|||" & trackArtist & "|||" & trackAlbum & "|||" & (trackDuration as string) & "|||" & (trackPosition as string) & "|||" & trackState & "|||" & persistID
end tell
    `);
    if (!result || result === "STOPPED") return null;
    const [name, artist, album, duration, position, state, persistentId] = result.split("|||");
    return { name, artist, album, duration: parseFloat(duration), position: parseFloat(position), state, persistentId };
  },

  getArtworkBase64() {
    const result = runMultiline(`
tell application "Music"
  if player state is stopped then return ""
  set t to current track
  if (count of artworks of t) > 0 then
    set artData to data of artwork 1 of t
    return artData
  end if
  return ""
end tell
    `);
    if (!result) return null;
    // AppleScript returns raw data — convert via python
    try {
      const py = `
import subprocess, base64, sys
result = subprocess.run(['osascript', '-e', '''
tell application "Music"
  if player state is stopped then return ""
  set t to current track
  if (count of artworks of t) > 0 then
    set artData to data of artwork 1 of t
    set artFile to (path to temporary items as string) & "bridge_art.jpg"
    set fileRef to open for access file artFile with write permission
    set eof of fileRef to 0
    write artData to fileRef
    close access fileRef
    return POSIX path of artFile
  end if
  return ""
end tell
'''], capture_output=True, text=True, timeout=5)
path = result.stdout.strip()
if path and path != '""':
  with open(path, 'rb') as f:
    data = f.read()
  print(base64.b64encode(data).decode())
`;
      const b64 = require("child_process").execSync(`python3 -c "${py.replace(/"/g, '\\"')}"`, { timeout: 8000 }).toString().trim();
      return b64 ? `data:image/jpeg;base64,${b64}` : null;
    } catch {
      return null;
    }
  },

  play() { run('tell application "Music" to play'); },
  pause() { run('tell application "Music" to pause'); },
  nextTrack() { run('tell application "Music" to next track'); },
  prevTrack() { run('tell application "Music" to previous track'); },
  setPosition(pos) { run(`tell application "Music" to set player position to ${pos}`); },

  playTrackById(persistentId) {
    runMultiline(`
tell application "Music"
  set theTrack to (first track of library playlist 1 whose persistent ID is "${persistentId}")
  play theTrack
end tell
    `);
  },

  getLibrary() {
    const result = runMultiline(`
tell application "Music"
  set output to ""
  set allTracks to every track of library playlist 1
  repeat with t in allTracks
    set trackName to name of t
    set trackArtist to artist of t
    set trackAlbum to album of t
    set trackDuration to duration of t
    set persistID to persistent ID of t
    set output to output & persistID & "|||" & trackName & "|||" & trackArtist & "|||" & trackAlbum & "|||" & (trackDuration as string) & "\\n"
  end repeat
  return output
end tell
    `);
    if (!result) return [];
    return result
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const [persistentId, name, artist, album, duration] = line.split("|||");
        return { persistentId, name, artist, album, duration: parseFloat(duration) };
      });
  },
};

module.exports = AS;
