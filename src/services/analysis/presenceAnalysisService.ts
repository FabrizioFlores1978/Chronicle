import {
  EpubBook,
  EpubChapter,
  CharacterProfile,
  LocationCodexEntry,
  CastPresenceMatrix,
  CastPresenceEntity,
  CastPresenceChapterSummary,
  EntityChapterPresence,
  PresenceOccurrence,
  PresenceEntityType,
} from '../../types/epub';

export interface AnalysisProgress {
  current: number;
  total: number;
  chapterTitle: string;
  percent: number;
}

/**
 * Cleanly strips HTML tags and translates common entities to plain readable text
 * while preserving appropriate word boundaries and line breaks.
 */
export function extractPlainTextFromHtml(html: string): string {
  if (!html) return '';

  let text = html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<head[\s\S]*?<\/head>/gi, ' ')
    .replace(/<\/(p|div|h[1-6]|li|blockquote|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&mdash;/gi, ' — ')
    .replace(/&ndash;/gi, ' – ')
    .replace(/&#8217;|&#8216;/gi, "'")
    .replace(/&#8220;|&#8221;/gi, '"');

  // Collapse consecutive whitespace on single lines
  return text
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n');
}

/**
 * Escapes regex special characters in a string.
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const NAME_PART_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'in', 'on', 'at', 'to', 'for', 'with', 'from',
  'de', 'la', 'le', 'von', 'van', 'der', 'del', 'della', 'di', 'da', 'dos', 'das',
  'mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'professor', 'lord', 'lady', 'sir', 'dame',
  'capt', 'captain', 'detective', 'agent', 'officer', 'sgt', 'sergeant', 'gen', 'general',
  'col', 'colonel', 'father', 'mother', 'sister', 'brother', 'uncle', 'aunt',
  'king', 'queen', 'prince', 'princess', 'duke', 'duchess', 'baron', 'count',
  'old', 'young', 'big', 'little', 'good', 'bad'
]);

interface EntitySearchDefinition {
  id: string;
  name: string;
  type: PresenceEntityType;
  roleOrType: string;
  color: string;
  avatarUrl?: string;
  aliases: string[];
  patterns: RegExp[];
}

/**
 * Prepares search patterns for an entity, expanding aliases, individual first/last name parts,
 * and handling English leading articles ("The ") intelligently.
 */
function prepareEntitySearchDefinition(
  id: string,
  name: string,
  type: PresenceEntityType,
  roleOrType: string,
  color: string,
  aliasesStr?: string,
  avatarUrl?: string,
  autoNameParts?: string[]
): EntitySearchDefinition {
  const tokenSet = new Set<string>();

  const addVariant = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.length < 2) return;
    tokenSet.add(trimmed);

    // If starts with "The ", also add the version without "The " if >= 3 chars
    if (/^the\s+/i.test(trimmed)) {
      const stripped = trimmed.replace(/^the\s+/i, '').trim();
      if (stripped.length >= 3) {
        tokenSet.add(stripped);
      }
    }
  };

  addVariant(name);

  // Add safe individual name parts (e.g. "Peter", "Prescott" from "Peter Prescott")
  if (autoNameParts) {
    for (const part of autoNameParts) {
      addVariant(part);
    }
  }

  if (aliasesStr) {
    // Split by comma, semicolon, or newline
    const rawAliases = aliasesStr.split(/[,;\n]/);
    for (const a of rawAliases) {
      addVariant(a);
    }
  }

  // Sort tokens by length descending so longer phrases match before sub-phrases
  const sortedTokens = Array.from(tokenSet).sort((a, b) => b.length - a.length);

  // Compile regex with word boundaries
  const patterns = sortedTokens.map(token => {
    const escaped = escapeRegExp(token);
    return new RegExp(`\\b${escaped}\\b`, 'gi');
  });

  return {
    id,
    name,
    type,
    roleOrType,
    color,
    avatarUrl,
    aliases: Array.from(tokenSet).filter(t => t.toLowerCase() !== name.toLowerCase()),
    patterns,
  };
}

/**
 * Extracts a concise context snippet around a match offset.
 */
function createSnippet(text: string, start: number, end: number): string {
  const contextLength = 55;
  const snippetStart = Math.max(0, start - contextLength);
  const snippetEnd = Math.min(text.length, end + contextLength);

  let snippet = text.substring(snippetStart, snippetEnd).replace(/\s+/g, ' ').trim();
  if (snippetStart > 0) snippet = '…' + snippet;
  if (snippetEnd < text.length) snippet = snippet + '…';

  return snippet;
}

/**
 * Searches for all non-overlapping occurrences of the entity patterns in the chapter text.
 */
function findEntityOccurrences(
  plainText: string,
  patterns: RegExp[]
): PresenceOccurrence[] {
  const occurrences: PresenceOccurrence[] = [];
  const occupiedRanges: [number, number][] = [];

  const isOverlapping = (start: number, end: number) => {
    for (const [oStart, oEnd] of occupiedRanges) {
      if (Math.max(start, oStart) < Math.min(end, oEnd)) {
        return true;
      }
    }
    return false;
  };

  for (const regex of patterns) {
    regex.lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(plainText)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      if (!isOverlapping(start, end)) {
        occupiedRanges.push([start, end]);
        occurrences.push({
          start,
          end,
          matchedText: match[0],
          snippet: createSnippet(plainText, start, end),
          charOffset: start,
        });
      }
    }
  }

  // Sort occurrences by start offset
  return occurrences.sort((a, b) => a.start - b.start);
}

/**
 * Main analysis function that scans all chapters against characters and locations.
 * Includes asynchronous stepped yields for real-time progress animation and wait time.
 */
export async function analyzeCastPresence(
  book: EpubBook,
  onProgress?: (progress: AnalysisProgress) => void
): Promise<CastPresenceMatrix> {
  const chapters: EpubChapter[] = book.chapters || [];
  const characters: CharacterProfile[] = book.writerData?.characters || [];
  const locations: LocationCodexEntry[] = book.writerData?.locations || [];

  // Index individual first/last name parts across all characters to detect shared names (e.g., shared surnames)
  const namePartFrequency = new Map<string, number>();
  characters.forEach(char => {
    const tokens = char.name.split(/[\s,.-]+/).filter(t => t.length >= 3);
    const uniqueTokensInName = new Set<string>();
    tokens.forEach(t => {
      const lower = t.toLowerCase();
      if (!NAME_PART_STOPWORDS.has(lower)) {
        uniqueTokensInName.add(lower);
      }
    });
    uniqueTokensInName.forEach(lower => {
      namePartFrequency.set(lower, (namePartFrequency.get(lower) || 0) + 1);
    });
  });

  // Safe name parts are those that belong uniquely to one character
  const getSafeNameParts = (charName: string): string[] => {
    const tokens = charName.split(/[\s,.-]+/).filter(t => t.length >= 3);
    return tokens.filter(t => {
      const lower = t.toLowerCase();
      return !NAME_PART_STOPWORDS.has(lower) && (namePartFrequency.get(lower) || 0) === 1;
    });
  };

  // Prepare entity definitions
  const entityDefs: EntitySearchDefinition[] = [];

  characters.forEach(char => {
    const autoParts = getSafeNameParts(char.name);
    entityDefs.push(
      prepareEntitySearchDefinition(
        char.id,
        char.name,
        'character',
        char.role || 'Supporting',
        char.color || '#3b82f6',
        char.aliases,
        char.avatarUrl,
        autoParts
      )
    );
  });

  locations.forEach(loc => {
    entityDefs.push(
      prepareEntitySearchDefinition(
        loc.id,
        loc.name,
        'location',
        loc.type || 'Setting',
        loc.color || '#10b981',
        loc.aliases,
        loc.imageUrl
      )
    );
  });

  const presenceMap: Record<string, EntityChapterPresence> = {};
  const chapterSummaries: CastPresenceChapterSummary[] = [];

  // Entity tracking counters across chapters
  const entityStats = new Map<
    string,
    {
      totalMentions: number;
      chaptersPresent: number;
      firstChapterOrder: number | null;
      lastChapterOrder: number | null;
      peakChapterId: string | null;
      peakChapterTitle: string | null;
      peakCount: number;
    }
  >();

  entityDefs.forEach(e => {
    entityStats.set(e.id, {
      totalMentions: 0,
      chaptersPresent: 0,
      firstChapterOrder: null,
      lastChapterOrder: null,
      peakChapterId: null,
      peakChapterTitle: null,
      peakCount: 0,
    });
  });

  const totalChapters = chapters.length;

  for (let i = 0; i < totalChapters; i++) {
    const chapter = chapters[i];
    const plainText = extractPlainTextFromHtml(chapter.content || chapter.originalXhtml || '');

    let chapterDistinctEntities = 0;
    let chapterTotalMentions = 0;

    for (const entity of entityDefs) {
      const occurrences = findEntityOccurrences(plainText, entity.patterns);
      const count = occurrences.length;
      const isPresent = count > 0;

      if (isPresent) {
        chapterDistinctEntities++;
        chapterTotalMentions += count;

        const stats = entityStats.get(entity.id)!;
        stats.totalMentions += count;
        stats.chaptersPresent += 1;

        if (stats.firstChapterOrder === null || chapter.order < stats.firstChapterOrder) {
          stats.firstChapterOrder = chapter.order;
        }
        if (stats.lastChapterOrder === null || chapter.order > stats.lastChapterOrder) {
          stats.lastChapterOrder = chapter.order;
        }
        if (count > stats.peakCount) {
          stats.peakCount = count;
          stats.peakChapterId = chapter.id;
          stats.peakChapterTitle = chapter.title;
        }
      }

      const key = `${entity.id}::${chapter.id}`;
      presenceMap[key] = {
        entityId: entity.id,
        entityType: entity.type,
        chapterId: chapter.id,
        chapterOrder: chapter.order,
        count,
        present: isPresent,
        firstMentionOffset: occurrences.length > 0 ? occurrences[0].start : null,
        occurrences,
      };
    }

    chapterSummaries.push({
      id: chapter.id,
      order: chapter.order,
      title: chapter.title || `Chapter ${i + 1}`,
      wordCount: chapter.wordCount || 0,
      distinctEntitiesCount: chapterDistinctEntities,
      totalMentionsCount: chapterTotalMentions,
    });

    if (onProgress) {
      onProgress({
        current: i + 1,
        total: totalChapters,
        chapterTitle: chapter.title || `Chapter ${i + 1}`,
        percent: Math.round(((i + 1) / totalChapters) * 100),
      });
    }

    // Stepped yield between chapters to provide responsive wait time and UI updates
    if (totalChapters > 1) {
      await new Promise(resolve => setTimeout(resolve, 75));
    }
  }

  // Finalize entity summary list
  const entities: CastPresenceEntity[] = entityDefs.map(def => {
    const stats = entityStats.get(def.id)!;
    return {
      id: def.id,
      name: def.name,
      type: def.type,
      roleOrType: def.roleOrType,
      color: def.color,
      aliases: def.aliases,
      avatarUrl: def.avatarUrl,
      totalMentions: stats.totalMentions,
      chaptersPresentCount: stats.chaptersPresent,
      firstChapterOrder: stats.firstChapterOrder,
      lastChapterOrder: stats.lastChapterOrder,
      peakChapterId: stats.peakChapterId,
      peakChapterTitle: stats.peakChapterTitle,
      peakCount: stats.peakCount,
    };
  });

  return {
    generatedAt: Date.now(),
    bookTitle: book.metadata?.title || 'Manuscript',
    totalChapters,
    chapters: chapterSummaries,
    entities,
    presenceMap,
  };
}
