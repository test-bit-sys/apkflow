export interface ManifestData {
  packageName: string;
  versionName: string;
  versionCode: string;
  minSdkVersion: string;
  targetSdkVersion: string;
  mainActivity: string;
  activities: string[];
  services: string[];
  receivers: string[];
  permissions: string[];
  exportedComponents: {
    name: string;
    type: 'activity' | 'service' | 'receiver' | 'provider';
    riskLevel: 'high' | 'medium' | 'low';
    details: string;
  }[];
}

export class AxmlDecoder {
  private buffer: Buffer;

  constructor(buffer: Buffer) {
    this.buffer = buffer;
  }

  public parse(): ManifestData {
    const result: ManifestData = {
      packageName: 'com.example.app',
      versionName: '1.0.0',
      versionCode: '1',
      minSdkVersion: '21',
      targetSdkVersion: '34',
      mainActivity: '',
      activities: [],
      services: [],
      receivers: [],
      permissions: [],
      exportedComponents: [],
    };

    try {
      // Check magic number
      const magic = this.buffer.readUInt32LE(0);
      if (magic !== 0x00080003) {
        // Fallback: extract string pool directly
        return this.fallbackRegexExtraction();
      }

      const strings = this.extractStringPool();

      // Scan strings to find package name, permissions, activities
      for (const str of strings) {
        if (str.startsWith('android.permission.') || str.includes('.permission.')) {
          if (!result.permissions.includes(str)) {
            result.permissions.push(str);
          }
        }
      }

      // Extract nodes
      this.parseChunks(strings, result);

      if (!result.mainActivity && result.activities.length > 0) {
        result.mainActivity = result.activities[0];
      }

      return result;
    } catch {
      return this.fallbackRegexExtraction();
    }
  }

  private extractStringPool(): string[] {
    const strings: string[] = [];
    if (this.buffer.length < 8) return strings;

    let offset = 8;
    while (offset < this.buffer.length - 8) {
      const chunkType = this.buffer.readUInt32LE(offset);
      const chunkSize = this.buffer.readUInt32LE(offset + 4);

      if (chunkType === 0x001c0001) {
        // String pool chunk
        const stringCount = this.buffer.readUInt32LE(offset + 8);
        const flags = this.buffer.readUInt32LE(offset + 16);
        const stringsStart = offset + this.buffer.readUInt32LE(offset + 20);
        const isUtf8 = (flags & (1 << 8)) !== 0;

        const stringOffsets: number[] = [];
        for (let i = 0; i < stringCount; i++) {
          stringOffsets.push(this.buffer.readUInt32LE(offset + 28 + i * 4));
        }

        for (const strOffset of stringOffsets) {
          const actualPos = stringsStart + strOffset;
          if (actualPos >= this.buffer.length) continue;

          if (isUtf8) {
            // UTF-8: length byte, then string
            let pos = actualPos;
            while (pos < this.buffer.length && (this.buffer[pos] & 0x80) !== 0) pos++;
            pos++; // length byte
            while (pos < this.buffer.length && (this.buffer[pos] & 0x80) !== 0) pos++;
            pos++; // byte length
            let end = pos;
            while (end < this.buffer.length && this.buffer[end] !== 0) end++;
            strings.push(this.buffer.toString('utf8', pos, end));
          } else {
            // UTF-16LE
            let pos = actualPos;
            let len = this.buffer.readUInt16LE(pos);
            pos += 2;
            if (len & 0x8000) {
              len = ((len & 0x7fff) << 16) | this.buffer.readUInt16LE(pos);
              pos += 2;
            }
            const byteLen = len * 2;
            if (pos + byteLen <= this.buffer.length) {
              strings.push(this.buffer.toString('utf16le', pos, pos + byteLen));
            }
          }
        }
        break;
      }

      if (chunkSize <= 0) break;
      offset += chunkSize;
    }

    return strings;
  }

  private parseChunks(strings: string[], result: ManifestData): void {
    let offset = 8;
    let currentTag = '';
    let currentActivityName = '';
    let isCurrentMainActivity = false;

    while (offset < this.buffer.length - 8) {
      const chunkType = this.buffer.readUInt32LE(offset);
      const chunkSize = this.buffer.readUInt32LE(offset + 4);
      if (chunkSize <= 0) break;

      if (chunkType === 0x00100102) {
        // START_TAG
        const nameIdx = this.buffer.readUInt32LE(offset + 20);
        const attrCount = this.buffer.readUInt16LE(offset + 28);
        currentTag = strings[nameIdx] || '';

        let componentName = '';
        let isExported: boolean | null = null;

        for (let i = 0; i < attrCount; i++) {
          const attrOffset = offset + 36 + i * 20;
          if (attrOffset + 20 > this.buffer.length) break;

          const attrNameIdx = this.buffer.readUInt32LE(attrOffset + 4);
          const attrValueIdx = this.buffer.readUInt32LE(attrOffset + 8);
          const attrTypedData = this.buffer.readUInt32LE(attrOffset + 16);
          const attrName = strings[attrNameIdx] || '';
          const attrValue = strings[attrValueIdx] || '';

          if (currentTag === 'manifest') {
            if (attrName === 'package') result.packageName = attrValue;
            if (attrName === 'versionName') result.versionName = attrValue;
            if (attrName === 'versionCode') result.versionCode = String(attrTypedData || attrValue);
          } else if (currentTag === 'uses-sdk') {
            if (attrName === 'minSdkVersion') result.minSdkVersion = String(attrTypedData || attrValue);
            if (attrName === 'targetSdkVersion') result.targetSdkVersion = String(attrTypedData || attrValue);
          } else if (['activity', 'activity-alias', 'service', 'receiver', 'provider'].includes(currentTag)) {
            if (attrName === 'name') componentName = attrValue;
            if (attrName === 'exported') isExported = attrTypedData === 1 || attrValue === 'true';
          }
        }

        if (componentName) {
          if (currentTag === 'activity' || currentTag === 'activity-alias') {
            currentActivityName = componentName;
            if (!result.activities.includes(componentName)) result.activities.push(componentName);
          } else if (currentTag === 'service') {
            if (!result.services.includes(componentName)) result.services.push(componentName);
          } else if (currentTag === 'receiver') {
            if (!result.receivers.includes(componentName)) result.receivers.push(componentName);
          }

          if (isExported === true) {
            result.exportedComponents.push({
              name: componentName,
              type: currentTag as any,
              riskLevel: currentTag === 'activity' ? 'medium' : 'high',
              details: `Explicitly exported component accessible by any third-party app without permissions.`,
            });
          }
        }
      } else if (chunkType === 0x00100103) {
        // END_TAG
        const nameIdx = this.buffer.readUInt32LE(offset + 20);
        const tag = strings[nameIdx] || '';
        if (tag === 'activity' || tag === 'activity-alias') {
          if (isCurrentMainActivity && currentActivityName) {
            result.mainActivity = currentActivityName;
          }
          currentActivityName = '';
          isCurrentMainActivity = false;
        }
      } else if (chunkType === 0x00100102 || chunkType === 0x00100104) {
        // Check if inside intent filter for main activity
        const content = this.buffer.toString('utf8', offset, Math.min(this.buffer.length, offset + chunkSize));
        if (content.includes('android.intent.action.MAIN') || content.includes('android.intent.category.LAUNCHER')) {
          isCurrentMainActivity = true;
        }
      }

      offset += chunkSize;
    }
  }

  private fallbackRegexExtraction(): ManifestData {
    const raw = this.buffer.toString('latin1');
    const strings: string[] = [];
    const strRegex = /[a-zA-Z0-9_\.]{4,100}/g;
    let match;
    while ((match = strRegex.exec(raw)) !== null) {
      strings.push(match[0]);
    }

    const permissions = strings.filter(s => s.startsWith('android.permission.') || s.includes('.permission.'));
    const packageCandidate = strings.find(s => 
      s.split('.').length >= 3 && 
      !s.startsWith('android.') && 
      !s.includes('schemas') &&
      !s.includes('permission') &&
      !s.includes('w3.org')
    ) || 'com.example.app';
    const activities = strings.filter(s => s.endsWith('Activity'));

    return {
      packageName: packageCandidate,
      versionName: '1.0.0',
      versionCode: '1',
      minSdkVersion: '21',
      targetSdkVersion: '34',
      mainActivity: activities[0] || 'MainActivity',
      activities: activities.slice(0, 15),
      services: strings.filter(s => s.endsWith('Service')).slice(0, 10),
      receivers: strings.filter(s => s.endsWith('Receiver')).slice(0, 10),
      permissions: Array.from(new Set(permissions)),
      exportedComponents: [],
    };
  }
}
