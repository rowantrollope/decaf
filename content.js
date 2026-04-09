// Calm Feed — Content Script
// Detects breathless tweets and rewrites them via Claude API

(function () {
  "use strict";

  const PROCESSED_ATTR = "data-calm-feed-processed";
  const DEFAULT_THRESHOLD = 3;
  const CACHE_KEY = "calmFeedCache";
  const MAX_CACHE_ENTRIES = 500;

  // ── Breathlessness Detector ──────────────────────────────────────────

  const FOMO_PHRASES = [
    "if you aren't",
    "if you arent",
    "if you're not",
    "you're missing out",
    "you are missing out",
    "don't miss",
    "dont miss",
    "don't sleep on",
    "dont sleep on",
    "ngmi",
    "not gonna make it",
    "left behind",
    "get left behind",
    "last chance",
    "act now",
    "before it's too late",
    "before its too late",
    "this is huge",
    "this is massive",
    "this changes everything",
    "game changer",
    "game-changer",
    "let that sink in",
    "read that again",
    "you need to see this",
    "people aren't paying attention",
    "people arent paying attention",
    "nobody is talking about",
    "no one is talking about",
    "wake up",
    "once in a lifetime",
    "once-in-a-lifetime",
    "just announced",
    "breaking",
    "not financial advice",
    "i'm shaking",
    "im shaking",
    "holy shit",
    "insane",
    "mind blown",
    "mind-blown",
    "you heard it here first",
  ];

  const HYPE_SUPERLATIVES = [
    "incredible",
    "unbelievable",
    "absolutely",
    "literally",
    "seriously",
    "unprecedented",
    "revolutionary",
    "groundbreaking",
    "earth-shattering",
    "jaw-dropping",
    "jaw dropping",
    "moonshot",
    "explosive",
    "skyrocket",
    "skyrocketing",
    "to the moon",
    "parabolic",
  ];

  function scoreBreathlessness(text) {
    let score = 0;
    const lower = text.toLowerCase();

    // ALL CAPS words (3+ chars)
    const capsWords = text.match(/\b[A-Z]{3,}\b/g) || [];
    score += Math.min(capsWords.length, 3);

    // Excessive punctuation: !!! or ???
    const excessivePunctuation = text.match(/[!?]{3,}/g) || [];
    score += excessivePunctuation.length;

    // Repeated alert/fire emojis (🚨🚨, 🔥🔥, ⚠️⚠️, 💀💀)
    const repeatedEmojis =
      text.match(/([\u{1F6A8}]{2,}|[\u{1F525}]{2,}|[\u{26A0}\u{FE0F}]{2,}|[\u{1F480}]{2,}|[\u{1F4A3}]{2,})/gu) || [];
    score += repeatedEmojis.length;

    // Siren or fire emoji count (even singles add up)
    const alertEmojis = text.match(/[\u{1F6A8}\u{1F525}]/gu) || [];
    if (alertEmojis.length >= 3) score += 1;

    // FOMO phrases
    for (const phrase of FOMO_PHRASES) {
      if (lower.includes(phrase)) score += 1;
    }

    // Hype superlatives
    for (const word of HYPE_SUPERLATIVES) {
      if (lower.includes(word)) score += 1;
    }

    // Thread bait: numbered lists with hype ("10 things...", "thread 🧵")
    if (/\bthread\b/i.test(text) && /\u{1F9F5}/u.test(text)) score += 1;

    // Excessive use of 💰, 📈, 🚀
    const moneyRocketEmojis = text.match(/[\u{1F4B0}\u{1F4C8}\u{1F680}]/gu) || [];
    if (moneyRocketEmojis.length >= 2) score += 1;

    return score;
  }

  // ── Cache ────────────────────────────────────────────────────────────

  function hashText(text) {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return "h" + hash;
  }

  async function getCache() {
    const result = await chrome.storage.local.get(CACHE_KEY);
    return result[CACHE_KEY] || {};
  }

  async function setCache(key, value) {
    const cache = await getCache();
    cache[key] = { text: value, ts: Date.now() };

    // Evict oldest entries if over limit
    const entries = Object.entries(cache);
    if (entries.length > MAX_CACHE_ENTRIES) {
      entries.sort((a, b) => a[1].ts - b[1].ts);
      const toRemove = entries.slice(0, entries.length - MAX_CACHE_ENTRIES);
      for (const [k] of toRemove) delete cache[k];
    }

    await chrome.storage.local.set({ [CACHE_KEY]: cache });
  }

  // ── Claude API ───────────────────────────────────────────────────────

  async function getSettings() {
    const result = await chrome.storage.sync.get({
      apiKey: "",
      threshold: DEFAULT_THRESHOLD,
      enabled: true,
      model: "claude-sonnet-4-20250514",
    });
    return result;
  }

  async function rewriteWithClaude(text, apiKey, model) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: model,
        max_tokens: 1024,
        messages: [
          {
            role: "user",
            content: `Rewrite the following social media post to be calm, grounded, and informative. Preserve ALL factual information and meaning, but strip out:
- Hype and breathless urgency
- FOMO-inducing language
- Excessive superlatives and exaggeration
- ALL CAPS for emphasis
- Anxiety-inducing framing

Keep it concise (similar length or shorter). Use a neutral, informative tone — like a good journalist would write. Do not add commentary or meta-text. Just return the rewritten post.

Original post:
${text}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API error (${response.status}): ${err}`);
    }

    const data = await response.json();
    return data.content[0].text;
  }

  // ── DOM Processing ───────────────────────────────────────────────────

  async function processTweet(tweetTextEl) {
    if (tweetTextEl.hasAttribute(PROCESSED_ATTR)) return;
    tweetTextEl.setAttribute(PROCESSED_ATTR, "true");

    const originalText = tweetTextEl.innerText;
    if (!originalText || originalText.length < 20) return;

    const settings = await getSettings();
    if (!settings.enabled || !settings.apiKey) return;

    const score = scoreBreathlessness(originalText);
    if (score < settings.threshold) return;

    const cacheKey = hashText(originalText);
    const cache = await getCache();

    let rewrittenText;
    if (cache[cacheKey]) {
      rewrittenText = cache[cacheKey].text;
    } else {
      try {
        rewrittenText = await rewriteWithClaude(
          originalText,
          settings.apiKey,
          settings.model
        );
        await setCache(cacheKey, rewrittenText);
      } catch (err) {
        console.error("[Calm Feed] Rewrite failed:", err);
        tweetTextEl.removeAttribute(PROCESSED_ATTR);
        return;
      }
    }

    // Store original for toggle
    tweetTextEl.dataset.calmFeedOriginal = originalText;
    tweetTextEl.dataset.calmFeedRewritten = rewrittenText;
    tweetTextEl.dataset.calmFeedShowingOriginal = "false";

    // Replace text content while preserving structure
    tweetTextEl.innerText = rewrittenText;
    tweetTextEl.classList.add("calm-feed-rewritten");

    // Add indicator
    const indicator = document.createElement("span");
    indicator.className = "calm-feed-indicator";
    indicator.textContent = " 🌿";
    indicator.title = "Rewritten by Calm Feed — click to toggle original";
    indicator.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      const showingOriginal =
        tweetTextEl.dataset.calmFeedShowingOriginal === "true";
      if (showingOriginal) {
        tweetTextEl.innerText = tweetTextEl.dataset.calmFeedRewritten;
        tweetTextEl.dataset.calmFeedShowingOriginal = "false";
        tweetTextEl.classList.add("calm-feed-rewritten");
        tweetTextEl.classList.remove("calm-feed-original");
      } else {
        tweetTextEl.innerText = tweetTextEl.dataset.calmFeedOriginal;
        tweetTextEl.dataset.calmFeedShowingOriginal = "true";
        tweetTextEl.classList.remove("calm-feed-rewritten");
        tweetTextEl.classList.add("calm-feed-original");
      }
      // Re-append indicator after innerText replacement
      tweetTextEl.appendChild(indicator);
    });
    tweetTextEl.appendChild(indicator);
  }

  function scanForTweets(root) {
    const tweets = root.querySelectorAll(
      `[data-testid="tweetText"]:not([${PROCESSED_ATTR}])`
    );
    tweets.forEach((el) => processTweet(el));
  }

  // ── MutationObserver ─────────────────────────────────────────────────

  function init() {
    // Process existing tweets
    scanForTweets(document);

    // Watch for new tweets loaded into the feed
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          // Check if the added node itself is a tweet text
          if (
            node.matches &&
            node.matches(`[data-testid="tweetText"]:not([${PROCESSED_ATTR}])`)
          ) {
            processTweet(node);
          }
          // Check children
          if (node.querySelectorAll) {
            scanForTweets(node);
          }
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  // Start when DOM is ready
  if (document.body) {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
