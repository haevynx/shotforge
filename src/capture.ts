// Captures screenshots straight from a running iOS Simulator or Android emulator/device.
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export function captureIos(file: string, cleanStatusBar: boolean) {
  if (cleanStatusBar) {
    // Apple-style status bar: 9:41, full battery, full signal.
    // Clear the previous override first, otherwise some fields (e.g. charging state) stick around.
    execFileSync('xcrun', ['simctl', 'status_bar', 'booted', 'clear'], {stdio: 'ignore'});
    execFileSync(
      'xcrun',
      [
        'simctl',
        'status_bar',
        'booted',
        'override',
        '--time',
        '9:41',
        '--dataNetwork',
        'wifi',
        '--wifiMode',
        'active',
        '--wifiBars',
        '3',
        '--cellularMode',
        'active',
        '--cellularBars',
        '4',
        '--batteryState',
        'discharging',
        '--batteryLevel',
        '100',
      ],
      {stdio: 'ignore'},
    );
  }
  fs.mkdirSync(path.dirname(file), {recursive: true});
  execFileSync('xcrun', ['simctl', 'io', 'booted', 'screenshot', '--type=png', file], {stdio: 'ignore'});
}

export function captureAndroid(file: string, cleanStatusBar: boolean) {
  const adb = (...args: string[]) => execFileSync('adb', args, {stdio: ['ignore', 'pipe', 'ignore']});
  if (cleanStatusBar) {
    // Android System UI demo mode: 9:41, full battery, no notification icons.
    adb('shell', 'settings', 'put', 'global', 'sysui_demo_allowed', '1');
    const demo = (cmd: string, extra: string[] = []) => adb('shell', 'am', 'broadcast', '-a', 'com.android.systemui.demo', '-e', 'command', cmd, ...extra);
    demo('enter');
    demo('clock', ['-e', 'hhmm', '0941']);
    demo('battery', ['-e', 'level', '100', '-e', 'plugged', 'false']);
    demo('network', ['-e', 'wifi', 'show', '-e', 'level', '4']);
    demo('notifications', ['-e', 'visible', 'false']);
  }
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, adb('exec-out', 'screencap', '-p'));
}
