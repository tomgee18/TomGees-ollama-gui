// app/page.test.js

// Copied and slightly adapted from app/page.js for testing, as it's not exported.
const generateSessionTitle = (messages) => {
  // Find the first message from a user.
  const firstUserMessage = messages.find(m => m.role === 'user');

  // If no user message, or if the content of the first user message is empty or only whitespace,
  // return "New Chat".
  if (!firstUserMessage || !firstUserMessage.content || !firstUserMessage.content.trim()) {
    return "New Chat";
  }

  const trimmedContent = firstUserMessage.content.trim();
  const title = trimmedContent.slice(0, 50);

  // Append "..." if the trimmed content was actually longer than 50 characters.
  return title.length < trimmedContent.length ? title + "..." : title;
};

describe('generateSessionTitle', () => {
  it('should return "New Chat" if there are no messages', () => {
    expect(generateSessionTitle([])).toBe("New Chat");
  });

  it('should return "New Chat" if there are no user messages', () => {
    const messages = [{ role: 'system', content: 'Welcome' }];
    expect(generateSessionTitle(messages)).toBe("New Chat");
  });

  it('should return "New Chat" if the first user message content is null', () => {
    const messages = [{ role: 'user', content: null }];
    expect(generateSessionTitle(messages)).toBe("New Chat");
  });

  it('should return "New Chat" if the first user message content is undefined', () => {
    const messages = [{ role: 'user', content: undefined }];
    expect(generateSessionTitle(messages)).toBe("New Chat");
  });

  it('should return "New Chat" if the first user message is empty', () => {
    const messages = [{ role: 'user', content: '' }];
    expect(generateSessionTitle(messages)).toBe("New Chat");
  });

  it('should return "New Chat" if the first user message is only whitespace', () => {
    const messages = [{ role: 'user', content: '   \t\n   ' }];
    expect(generateSessionTitle(messages)).toBe("New Chat");
  });

  it('should return the message if it is short and has no extra spaces', () => {
    const messages = [{ role: 'user', content: 'Hello' }];
    expect(generateSessionTitle(messages)).toBe("Hello");
  });

  it('should return the trimmed message if it is short and has trailing/leading spaces', () => {
    const messages = [{ role: 'user', content: '  Hello World   ' }];
    expect(generateSessionTitle(messages)).toBe("Hello World");
  });

  it('should return the message as is if it is exactly 50 characters long (no spaces)', () => {
    const content = '12345678901234567890123456789012345678901234567890'; // 50 chars
    const messages = [{ role: 'user', content: content }];
    expect(generateSessionTitle(messages)).toBe(content);
  });

  it('should return the trimmed message if it is exactly 50 characters after trimming', () => {
    const content = '  12345678901234567890123456789012345678901234567890  '; // 50 chars content
    const expected = '12345678901234567890123456789012345678901234567890';
    const messages = [{ role: 'user', content: content }];
    expect(generateSessionTitle(messages)).toBe(expected);
  });

  it('should truncate and add "..." if the message is longer than 50 characters', () => {
    const content = 'This is a very long message that definitely exceeds the fifty character limit for session titles.';
    const expected = 'This is a very long message that definitely exceed...'
    const messages = [{ role: 'user', content: content }];
    expect(generateSessionTitle(messages)).toBe(expected);
  });

  it('should truncate and add "..." if the trimmed message is longer than 50 characters', () => {
    const content = '  This is a very long message that definitely exceeds the fifty character limit for session titles with spaces.   ';
    const expected = 'This is a very long message that definitely exceed...'
    const messages = [{ role: 'user', content: content }];
    expect(generateSessionTitle(messages)).toBe(expected);
  });

  it('should return the trimmed message without "..." if original is >50 due to spaces but trimmed is <50', () => {
    const content = 'Short content                                                '; // Content is <50, total length >50
    const expected = 'Short content';
    const messages = [{ role: 'user', content: content }];
    expect(generateSessionTitle(messages)).toBe(expected);
  });

  it('should use the first user message among many messages', () => {
    const messages = [
      { role: 'system', content: 'System boot' },
      { role: 'user', content: 'This is the first actual user message, it should be used for the title.' },
      { role: 'ai', content: 'Okay.' },
      { role: 'user', content: 'This is a second user message, and should be ignored.' }
    ];
        const expected = 'This is the first actual user message, it should b...';
    expect(generateSessionTitle(messages)).toBe(expected);
  });
   it('should handle messages with mixed whitespace correctly', () => {
    const messages = [{ role: 'user', content: '\t\n  A message with mixed whitespace. \n\n  ' }];
    expect(generateSessionTitle(messages)).toBe("A message with mixed whitespace.");
  });
});
